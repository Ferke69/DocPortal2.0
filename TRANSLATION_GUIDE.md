# Translation Guide for SimplePractice Clone

## Overview
This application supports 8 European languages. All translations are stored in JSON files in `/app/frontend/src/i18n/locales/`.

## How to Update Translations

### 1. Translation File Structure
Each language has its own JSON file:
- `en.json` - English (base language)
- `sl.json` - Slovenian (Slovenščina)
- `de.json` - German (Deutsch)
- `fr.json` - French (Français)
- `es.json` - Spanish (Español)
- `it.json` - Italian (Italiano)
- `pt.json` - Portuguese (Português)
- `nl.json` - Dutch (Nederlands)

### 2. File Location
```
/app/frontend/src/i18n/locales/
├── en.json
├── sl.json
├── de.json
├── fr.json
├── es.json
├── it.json
├── pt.json
└── nl.json
```

### 3. Translation Key Structure
All translations are organized by section:
```json
{
  "landing": { ... },      // Landing page text
  "features": { ... },     // Features section
  "provider": { ... },     // Provider dashboard
  "client": { ... },       // Client portal
  "messaging": { ... },    // Messaging center
  "booking": { ... },      // Appointment booking
  "billing": { ... },      // Billing & payments
  "common": { ... },       // Common UI elements
  "languages": { ... }     // Language names
}
```

### 4. How to Edit Translations

#### Step 1: Open the translation file
```bash
# For Slovenian
nano /app/frontend/src/i18n/locales/sl.json

# Or use any text editor
code /app/frontend/src/i18n/locales/sl.json
```

#### Step 2: Find the key you want to translate
Example: To change "Welcome back" in Slovenian:
```json
{
  "provider": {
    "welcome": "Dobrodošli nazaj, {{name}}"  // ← Edit this text
  }
}
```

#### Step 3: Update the text
```json
{
  "provider": {
    "welcome": "Pozdravljeni, {{name}}"  // ← Your new translation
  }
}
```

**Important**: Keep `{{name}}` or any `{{variable}}` exactly as is - these are placeholders!

#### Step 4: Save and restart
```bash
# Save the file (Ctrl+S or :wq in nano/vim)

# Restart frontend to see changes
sudo supervisorctl restart frontend
```

### 5. Translation Variables

Some translations have variables that get replaced with real data:

```json
"welcome": "Welcome back, {{name}}"
```

The `{{name}}` will be replaced with the actual user's name. **Never translate or remove these!**

Examples:
- `{{name}}` - User's name
- `{{date}}` - Date
- `{{time}}` - Time
- `{{amount}}` - Money amount

### 6. Special Characters

#### For HTML entities, use actual characters:
- ✓ Use: `à, é, ñ, ö, ü, ç`
- ✗ Don't use: `&agrave;, &#233;`

#### For quotes and special punctuation:
```json
"description": "Text with \"quotes\" inside"
```

### 7. Testing Your Translations

1. Open the app: `http://localhost:3000`
2. Click the language selector (globe icon)
3. Select your language
4. Navigate through the app to verify all translations

### 8. Translation Quality Checklist

When reviewing/correcting translations, check:
- [ ] Professional medical/healthcare terminology
- [ ] Formal tone (appropriate for healthcare)
- [ ] Consistent terminology across all pages
- [ ] Gender-neutral language where possible
- [ ] Cultural appropriateness
- [ ] No Google Translate artifacts
- [ ] Proper HIPAA/compliance terminology

### 9. Context for Translators

#### Medical/Healthcare Terms to Review Carefully:
- "Clinical notes" - These are official medical documentation
- "HIPAA Compliance" - US healthcare privacy law (may need localization)
- "Provider" - Healthcare professional (doctor, therapist, psychiatrist)
- "Client" vs "Patient" - We use "Client" for mental health context
- "Session" - Therapy session, not meeting
- "Intake" - Initial assessment appointment

#### Button Labels Should Be:
- Short and actionable
- Use imperative verbs ("Book", "Send", "Pay")
- Consistent across the app

#### Important Phrases:
- "Book Appointment" - Main action for clients
- "Join Session" - Video call entry point
- "Send Message" - Secure messaging
- "Pay Now" - Payment action

### 10. Common Translation Mistakes to Avoid

❌ **Don't**:
- Translate brand names (SimplePractice, Stripe)
- Translate "HIPAA" (it's an acronym)
- Change variable placeholders like `{{name}}`
- Use informal language (tu/du instead of vous/Sie)
- Add or remove punctuation that changes meaning

✓ **Do**:
- Keep the professional healthcare tone
- Maintain consistency with medical terminology
- Consider cultural context (e.g., privacy expectations)
- Use standard medical abbreviations for your language
- Test the translation in context

### 11. Quick Reference: Key Sections to Review

Priority areas for professional translator review:

1. **Landing Page** (`landing` section)
   - First impression, marketing copy
   - Should sound professional and trustworthy

2. **Clinical Notes** (`provider.pendingNotes`, clinical note types)
   - Medical documentation terminology
   - Must be medically accurate

3. **Billing & Compliance** (`billing` section)
   - Legal/financial terminology
   - HIPAA compliance messaging

4. **Messaging** (`messaging` section)
   - Privacy and security messaging
   - "Encrypted" and "HIPAA-compliant" terms

### 12. Adding a New Language

If you want to add another language:

1. Copy `en.json` to new file (e.g., `hr.json` for Croatian)
```bash
cp /app/frontend/src/i18n/locales/en.json /app/frontend/src/i18n/locales/hr.json
```

2. Translate all values in the new file

3. Add language to config in `/app/frontend/src/i18n/config.js`:
```javascript
import hr from './locales/hr.json';

const resources = {
  // ... existing languages
  hr: { translation: hr }
};
```

4. Add to language selector in `/app/frontend/src/components/LanguageSelector.jsx`:
```javascript
{ code: 'hr', name: 'Hrvatski', flag: '🇭🇷' }
```

### 13. Translation Status

Current status of translations:
- ✅ **English** - Complete (source language)
- ⚠️ **Slovenian** - Machine translated, needs professional review
- ⚠️ **German** - Machine translated, needs professional review
- ⚠️ **French** - Machine translated, needs professional review
- ⚠️ **Spanish** - Machine translated, needs professional review
- ⚠️ **Italian** - Machine translated, needs professional review
- ⚠️ **Portuguese** - Machine translated, needs professional review
- ⚠️ **Dutch** - Machine translated, needs professional review

### 14. Professional Translator Notes

When hiring a professional translator, provide them with:

1. **Context**: This is a mental health practice management platform
2. **Tone**: Professional, trustworthy, HIPAA-compliant
3. **Audience**: 
   - Healthcare providers (psychiatrists, therapists)
   - Patients/clients seeking mental health care
4. **Key files**: 
   - All files in `/app/frontend/src/i18n/locales/`
   - Prioritize your target language file
5. **Testing**: They should test translations in-app at `http://localhost:3000`

### 15. Contact for Translation Issues

If you encounter any technical issues with translations:
- File location issues
- Variables not working
- Text not appearing
- Language selector problems

Check the browser console (F12) for errors and verify:
1. JSON syntax is valid (no missing commas, brackets)
2. All variables like `{{name}}` are preserved
3. File is saved with UTF-8 encoding

---

## Quick Commands

```bash
# Edit Slovenian translations
nano /app/frontend/src/i18n/locales/sl.json

# Check JSON syntax
cat /app/frontend/src/i18n/locales/sl.json | python3 -m json.tool

# Restart frontend
sudo supervisorctl restart frontend

# View frontend logs
tail -f /var/log/supervisor/frontend.out.log
```

---

## Example: Correcting a Translation

### Before (machine translated):
```json
{
  "provider": {
    "welcome": "Dobrodošli nazaj, {{name}}",
    "description": "Tukaj je, kaj se danes dogaja z vašo prakso."
  }
}
```

### After (professionally translated):
```json
{
  "provider": {
    "welcome": "Pozdravljeni, {{name}}",
    "description": "Pregled današnjih aktivnosti vaše prakse."
  }
}
```

Save, restart, and test!

---
