# 🚀 Autonomous Bug Hunter - Quick Start Guide

Get started with the Autonomous Bug Hunter in 5 minutes!

---

## ⚡ Prerequisites

1. **API Key** from Google AI Studio: https://ai.google.dev/
2. **Dev server** running: `npm run dev`
3. **Cypress** installed (already included)

---

## 📝 Step 1: Add API Key

Add to `.env.local`:

```env
GOOGLE_AI_STUDIO_KEY=your-api-key-here
```

---

## 🎮 Step 2: Run Your First Test

```bash
# Basic test run (Chrome, desktop, Finnish)
npm run bug-hunter
```

This will:
- ✅ Generate AI-powered test scenarios
- ✅ Execute tests
- ✅ Detect bugs
- ✅ Generate fix plans
- ✅ Create HTML report

**Duration:** ~5-10 minutes

---

## 📊 Step 3: View Results

Open the generated report:

```bash
# macOS
open test-results/autonomous-bug-hunter/report-*.html

# Linux
xdg-open test-results/autonomous-bug-hunter/report-*.html

# Windows
start test-results/autonomous-bug-hunter/report-*.html
```

---

## 🎯 Step 4: Customize

Create `bug-hunter.config.json`:

```json
{
  "browsers": ["chrome"],
  "devices": ["desktop"],
  "locales": ["fi"],
  "testCategories": ["navigation", "form", "ui"],
  "generateFixPlans": true,
  "reportFormat": "html"
}
```

Run again:

```bash
npm run bug-hunter
```

---

## 🔄 Step 5: Continuous Monitoring

Start continuous testing (every 60 minutes):

```bash
npm run bug-hunter:continuous
```

In a separate terminal, open the dashboard:

```bash
npm run bug-hunter:dashboard
```

---

## 🐛 Step 6: Review Fix Plans

If bugs are found, review fix plans:

```bash
cat test-results/autonomous-bug-hunter/fix-plans-*.md
```

Example fix plan:

```markdown
## Fix Plan #1: Login Form Validation Error

**Confidence:** 85%
**Effort:** quick

### Files to Modify
- `components/auth/LoginForm.tsx`

### Fix Steps

1. Add email validation before submit
   - Add Zod schema validation
   - Check email format

2. Display error message
   - Show validation error to user
   - Prevent form submission

### Testing Required
- Test with invalid emails
- Test with valid emails
- Test form submission
```

---

## ✅ Step 7: Implement Fixes

⚠️ **IMPORTANT:** The bug hunter NEVER auto-executes fixes!

**You must:**
1. Review the fix plan
2. Verify the suggested changes
3. Manually implement
4. Test thoroughly
5. Commit changes

---

## 🎉 You're Done!

### What's Next?

**Expand Testing:**
```bash
# Test multiple browsers
npm run bug-hunter -- --browsers "chrome,firefox,safari"

# Test multiple devices
npm run bug-hunter -- --devices "desktop,mobile,tablet"

# Test all languages
npm run bug-hunter -- --locales "fi,en,sv"
```

**Production Monitoring:**
```bash
# Stricter checks, every 30 minutes
npm run bug-hunter:prod
```

**CI/CD Integration:**
```bash
# Add to your pipeline
npm run bug-hunter:ci
```

---

## 🆘 Troubleshooting

### Issue: "No API key found"

**Solution:**
```bash
echo "GOOGLE_AI_STUDIO_KEY=your-key" >> .env.local
```

### Issue: "Dev server not running"

**Solution:**
```bash
# Terminal 1
npm run dev

# Terminal 2 (wait 10 seconds)
npm run bug-hunter
```

### Issue: "No scenarios generated"

**Solution:**
```bash
# Check your codebase structure
ls app/[locale]/
ls components/

# Verify API key works
npm run gemini -- --prompt "Hello"
```

### Issue: "Tests timeout"

**Solution:**
Create `bug-hunter.config.json`:
```json
{
  "testTimeout": 120000,
  "maxRetries": 3
}
```

---

## 📚 Learn More

- **Full Documentation:** [AUTONOMOUS_BUG_HUNTER.md](./AUTONOMOUS_BUG_HUNTER.md)
- **Custom Scenarios:** [cypress/scenarios/custom-examples.ts](../cypress/scenarios/custom-examples.ts)
- **Configuration:** [autonomous-bug-hunter.config.ts](../autonomous-bug-hunter.config.ts)

---

## 💡 Pro Tips

1. **Start Small:** Test one browser/device/locale first
2. **Review Daily:** Check fix plans every morning
3. **Tune Config:** Adjust `minSeverity` based on your team
4. **Monitor Dashboard:** Keep it open during development
5. **Custom Scenarios:** Add your critical user flows

---

## 🎊 Success!

You now have an AI-powered autonomous testing agent monitoring your application 24/7!

**Remember:**
- ✅ It finds bugs automatically
- ✅ It generates fix plans automatically
- ❌ It NEVER executes fixes automatically
- ✅ You review and approve all changes

---

_Happy Bug Hunting!_ 🤖🐛

**Questions?** Check the [full documentation](./AUTONOMOUS_BUG_HUNTER.md) or open an issue.

