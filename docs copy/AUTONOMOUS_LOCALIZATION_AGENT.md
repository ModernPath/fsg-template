# 🌍 Autonomous Localization Agent

An intelligent agent that automatically crawls your website, identifies missing translations, and generates natural, culturally-appropriate translations using AI.

## Features

### 🕷️ Automatic Website Crawling
- Crawls website pages systematically
- Extracts all visible text content
- Identifies context (headings, buttons, paragraphs, etc.)
- Detects namespace associations automatically

### 🔍 Translation Analysis
- Compares extracted text with existing translations
- Identifies missing translations across all locales
- Categorizes by severity (missing-all, missing-fi, missing-sv)
- Analyzes by namespace

### 🤖 AI-Powered Translation
- Uses Google Gemini AI for natural translations
- Focuses on cultural adaptation, not literal translation
- Maintains professional tone for financial services
- Preserves placeholders and formatting
- Rate-limited to avoid API quotas

### 💾 Automatic File Updates
- Updates translation JSON files automatically
- Maintains proper file structure
- Preserves existing translations
- Adds only missing translations

## Installation

The agent is already installed. Just ensure:
1. Dev server is running: `npm run dev`
2. Gemini API key is in `.env.local`

## Usage

### Full Analysis & Translation (Recommended)

```bash
# Full workflow: crawl + analyze + translate (NO file updates)
npm run localization-agent

# With file updates (adds translations to files)
npm run localization-agent -- --update
```

### Individual Modes

```bash
# Only crawl website
npm run localization-agent:crawl

# Only analyze existing translations
npm run localization-agent:analyze

# Only generate translations (requires previous analysis)
npm run localization-agent:translate

# Full workflow WITH file updates
npm run localization-agent:update
```

### Advanced Options

```bash
# Limit number of pages to crawl
npm run localization-agent -- --max-pages 20

# Combine options
npm run localization-agent -- --update --max-pages 50
```

## How It Works

### 1. Website Crawling Phase

The agent:
- Launches a headless Chromium browser
- Navigates through key pages (/fi, /en, /sv, /dashboard, /admin, etc.)
- Extracts all visible text from:
  - Headings (h1-h6)
  - Paragraphs
  - Buttons
  - Links
  - Labels
  - Form elements
- Detects page context and namespace automatically

### 2. Analysis Phase

The agent:
- Loads all existing translation files from `messages/`
- Compares translations across locales (en, fi, sv)
- Identifies missing translations:
  - `missing-all`: No translation in fi or sv
  - `missing-fi`: Missing Finnish translation
  - `missing-sv`: Missing Swedish translation
- Groups by namespace for organized reporting

### 3. Translation Phase

The agent:
- Takes top 50 missing translations (to avoid rate limits)
- Generates natural translations using Gemini AI
- **Focuses on cultural adaptation:**
  - Finnish: Considers grammatical cases, formal tone
  - Swedish: Considers definite/indefinite forms, "ni" vs "du"
  - English: Clear, concise, professional
- Preserves placeholders like `{name}`, `{count}`, etc.
- Rate-limits API calls (500ms between requests)

### 4. Update Phase (Optional)

If `--update` flag is used:
- Loads existing translation files
- Merges new translations
- Writes back to JSON files
- Maintains formatting

## Example Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Run full analysis (dry-run)
npm run localization-agent

# 3. Review the report
# Check: test-results/localization-agent/localization-report-*.md

# 4. If satisfied, update files
npm run localization-agent -- --update

# 5. Verify changes
npm run check-translations
```

## Output Reports

### Markdown Report
Located in: `test-results/localization-agent/localization-report-TIMESTAMP.md`

Contains:
- Summary statistics
- Missing translations by namespace
- Generated translations with AI reasoning

### JSON Report
Located in: `test-results/localization-agent/localization-report-TIMESTAMP.json`

Contains:
- Full data structure
- Configuration used
- All extracted content
- All missing translations
- All generated translations

## Configuration

Edit `tools/autonomous-localization-agent.ts` to customize:

```typescript
const config = {
  baseUrl: 'http://localhost:3000',
  locales: ['en', 'fi', 'sv'],
  sourceLocale: 'fi',
  maxPages: 50,
  updateFiles: false,
};
```

## Translation Quality

The AI generates **natural, culturally-appropriate** translations, not literal word-for-word translations:

### Example: "Tervetuloa takaisin!"

❌ Literal translation: "Welcome back!"
✅ Natural translation: "Welcome back!" (same, but with proper context)

### Example: Finnish business term "Y-tunnus"

❌ Literal: "Y-number"
✅ Natural (Swedish): "Organisationsnummer"
✅ Natural (English): "Business ID"

## Limitations

1. **Rate Limits**: Gemini AI has rate limits (10 requests/minute)
   - Agent limits to 50 translations per run
   - Adds 500ms delay between requests

2. **Context Understanding**: AI may not always understand full business context
   - Review generated translations before committing
   - Especially for financial/legal terms

3. **Crawling Depth**: Limited to configured max pages
   - Default: 30 pages
   - Increase with `--max-pages` flag

4. **Authentication**: Cannot crawl protected pages
   - Only public and guest-accessible pages
   - Admin/Partner pages will show auth prompts

## Best Practices

### ✅ DO:
- Run regularly during development
- Review AI-generated translations
- Use `--update` only after review
- Keep max-pages reasonable (30-50)
- Run during off-hours to avoid rate limits

### ❌ DON'T:
- Don't blindly trust all translations
- Don't run on production (use localhost)
- Don't set max-pages too high (rate limits)
- Don't skip manual review for critical text
- Don't update files without checking reports first

## Integration with Translation Workflow

```bash
# 1. Developer adds new feature with English text
# 2. Run localization agent
npm run localization-agent

# 3. Review generated translations
cat test-results/localization-agent/localization-report-*.md

# 4. Update files if satisfied
npm run localization-agent -- --update

# 5. Verify completeness
npm run check-translations

# 6. Commit changes
git add messages/
git commit -m "chore: add translations for new feature"
```

## Troubleshooting

### "No translations generated"
- Check if dev server is running
- Verify API key in `.env.local`
- Check rate limit (wait 1 minute, try again)

### "Pages not crawling"
- Ensure dev server is running on port 3000
- Check for JavaScript errors in browser console
- Verify pages are accessible

### "Translations are literal/awkward"
- AI may need better context
- Manually edit generated translations
- Consider adding to translation guidelines

### "Files not updating"
- Did you use `--update` flag?
- Check file permissions
- Verify `messages/` directory structure

## Architecture

```
AutonomousLocalizationAgent
│
├── Website Crawling
│   ├── Playwright browser automation
│   ├── Text extraction from DOM
│   └── Context detection
│
├── Translation Analysis
│   ├── Load existing translations
│   ├── Compare across locales
│   └── Identify missing translations
│
├── AI Translation
│   ├── Gemini API integration
│   ├── Natural language generation
│   └── Cultural adaptation
│
└── File Management
    ├── JSON file updates
    ├── Merge strategy
    └── Report generation
```

## Future Enhancements

- [ ] Support for authenticated crawling (admin/partner pages)
- [ ] Automatic pull request creation
- [ ] Translation quality scoring
- [ ] A/B testing integration
- [ ] Continuous monitoring mode
- [ ] Slack/email notifications
- [ ] Translation memory/glossary
- [ ] Multi-model AI comparison

## Related Tools

- `npm run check-translations` - Verify translation completeness
- `npm run split-locales` - Split monolithic translation files
- `npm run import-translations:local` - Import translations locally
- `npm run bug-hunter` - Find bugs automatically

## Support

For issues or questions:
1. Check this documentation
2. Review generated reports
3. Check translation guidelines in `.cursor/rules/`
4. Review example translations in `messages/`

---

**Happy Localizing! 🌍**

