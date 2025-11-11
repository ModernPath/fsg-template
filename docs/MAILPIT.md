# Mailpit Email Testing Guide

## Overview

Mailpit is integrated into the Supabase local development setup for testing emails without actually sending them. All emails sent by the application are captured and can be viewed in the Mailpit web interface.

## Accessing Mailpit

### Web Interface
Open your browser and navigate to:
```
http://localhost:54324
```

**Features:**
- 📧 View all captured emails in real-time
- 🔍 Search emails by recipient, subject, or content
- 📱 Preview emails in HTML and plain text
- 💾 Download emails in various formats
- 🗑️ Clear all emails or delete individual messages

### SMTP Configuration

Mailpit runs on the following ports:
- **Web Interface**: `54324` (HTTP)
- **SMTP Server**: `54325` (optional, can be enabled in config)

## How It Works

### Supabase Auth Emails

All authentication emails (signup confirmations, password resets, magic links) are automatically captured by Mailpit:

1. **User signs up** → Email confirmation sent to Mailpit
2. **Password reset** → Reset link appears in Mailpit
3. **Magic link login** → Link captured in Mailpit
4. **Email change** → Verification emails in Mailpit

### Application Emails

If you're sending emails from your application using SendGrid or other services in production, you can configure them to use Mailpit in development.

## Testing Workflow

### 1. Start Supabase

```bash
npx supabase start
```

Mailpit starts automatically and is available at `http://localhost:54324`.

### 2. Trigger an Email

**Example: User Registration**
```bash
# Register a new user via the UI or API
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. View in Mailpit

1. Open http://localhost:54324
2. See the confirmation email
3. Click the confirmation link (it will work locally!)

## Common Email Types

### Authentication Emails

#### 1. **Email Confirmation**
- **Trigger**: New user registration
- **Contains**: Confirmation link to verify email
- **Template**: Supabase default template

#### 2. **Password Reset**
- **Trigger**: Forgot password flow
- **Contains**: Reset password link
- **Template**: Supabase default template

#### 3. **Magic Link**
- **Trigger**: Passwordless login
- **Contains**: One-time login link
- **Template**: Supabase default template

#### 4. **Email Change**
- **Trigger**: User changes email address
- **Contains**: Verification for both old and new emails
- **Template**: Supabase default template

### Custom Emails

If you're sending custom emails from your application:

```typescript
// Example: Sending via Supabase Functions or API
import { Resend } from 'resend';

// In development, configure to use Mailpit
const resend = new Resend(
  process.env.NODE_ENV === 'production' 
    ? process.env.RESEND_API_KEY 
    : 'test-key'
);

// Emails will be captured in Mailpit during development
await resend.emails.send({
  from: 'noreply@bizexit.fi',
  to: user.email,
  subject: 'Welcome to BizExit!',
  html: '<p>Welcome!</p>'
});
```

## Configuration

### Supabase Config (supabase/config.toml)

```toml
[inbucket]
enabled = true
port = 54324
# Uncomment to expose SMTP port for external testing
# smtp_port = 54325
# pop3_port = 54326
```

### Email Templates

Supabase Auth email templates can be customized in Supabase Studio:
1. Go to http://localhost:54323
2. Navigate to Authentication > Email Templates
3. Customize templates with your branding

## Development vs Production

### Development (Mailpit)
```env
# .env.local
NODE_ENV=development
# Emails captured by Mailpit automatically
```

### Production (Real Email Service)
```env
# .env.production
NODE_ENV=production
SENDGRID_API_KEY=your_sendgrid_key
RESEND_API_KEY=your_resend_key
```

## Troubleshooting

### Emails Not Appearing

1. **Check Supabase is running**
   ```bash
   npx supabase status
   ```

2. **Verify Mailpit is healthy**
   ```bash
   docker ps | grep mailpit
   ```

3. **Check Mailpit logs**
   ```bash
   docker logs supabase_inbucket_fsg-template
   ```

### Cannot Access Web Interface

1. **Verify port is not in use**
   ```bash
   lsof -i :54324
   ```

2. **Restart Supabase**
   ```bash
   npx supabase stop
   npx supabase start
   ```

### Email Links Don't Work

Make sure your `NEXT_PUBLIC_SITE_URL` is set correctly:
```env
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Best Practices

### 1. Clear Emails Regularly

Mailpit stores emails in memory. Clear them periodically to avoid clutter:
- Click "Clear all" in the web interface
- Or restart Supabase: `npx supabase restart`

### 2. Test All Email Flows

Before deploying to production, test:
- ✅ User registration confirmation
- ✅ Password reset
- ✅ Email change verification
- ✅ Custom transactional emails
- ✅ Email templates render correctly

### 3. Check Spam Triggers

Mailpit has a spam analysis feature. Use it to check if your emails might trigger spam filters.

### 4. Test on Mobile

Mailpit shows how emails look on different devices. Use this to ensure mobile compatibility.

## API Access

Mailpit also provides a REST API for automated testing:

```bash
# Get all emails
curl http://localhost:54324/api/v1/messages

# Get specific email
curl http://localhost:54324/api/v1/message/{id}

# Delete all emails
curl -X DELETE http://localhost:54324/api/v1/messages
```

## Integration with Tests

### Cypress E2E Tests

```typescript
// cypress/e2e/auth.cy.ts
describe('User Registration', () => {
  it('sends confirmation email', () => {
    // Register user
    cy.visit('/auth/sign-up');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    // Check email in Mailpit
    cy.request('http://localhost:54324/api/v1/messages')
      .its('body')
      .should('have.length.at.least', 1);
  });
});
```

## Resources

- [Mailpit GitHub](https://github.com/axllent/mailpit)
- [Supabase Email Documentation](https://supabase.com/docs/guides/auth/auth-email)
- [Email Template Customization](https://supabase.com/docs/guides/auth/auth-email-templates)

## Quick Commands

```bash
# Open Mailpit in browser
open http://localhost:54324

# View Mailpit logs
docker logs -f supabase_inbucket_fsg-template

# Restart Mailpit (via Supabase)
npx supabase restart

# Check Mailpit status
curl http://localhost:54324/api/v1/info
```

---

**Pro Tip**: Bookmark `http://localhost:54324` for quick access during development! 🚀

