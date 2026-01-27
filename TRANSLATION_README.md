# Translation Management - Quick Start

## For Non-Technical Users

### How to Update Slovenian (or any language)

1. **Find the translation file**:
   - Go to: `/app/frontend/src/i18n/locales/`
   - Open `sl.json` for Slovenian (or your language code)

2. **Edit the text**:
   - Find the text you want to change
   - Update it (keep `{{variables}}` unchanged!)
   - Save the file

3. **Apply changes**:
   ```bash
   sudo supervisorctl restart frontend
   ```

4. **Test**:
   - Open http://localhost:3000
   - Select your language from the dropdown
   - Verify your changes

## Language Codes
- `en.json` = English
- `sl.json` = Slovenian (Slovenščina) ⭐
- `de.json` = German (Deutsch)
- `fr.json` = French (Français)
- `es.json` = Spanish (Español)
- `it.json` = Italian (Italiano)
- `pt.json` = Portuguese (Português)
- `nl.json` = Dutch (Nederlands)

## Validation Tool

Check if your translations are correct:

```bash
python3 /app/scripts/validate_translations.py
```

This will tell you:
- ✅ If all translations are complete
- ⚠️ If any keys are missing
- ⚠️ If any variables like `{{name}}` are incorrect

## Important Rules

1. **Never remove or change** `{{variable}}` placeholders
2. **Keep the same tone**: Professional healthcare language
3. **Save as UTF-8** encoding
4. **Test after changes**: Always verify in the browser

## Need Help?

See full guide: `/app/TRANSLATION_GUIDE.md`

## Quick Commands

```bash
# Edit Slovenian
nano /app/frontend/src/i18n/locales/sl.json

# Validate all translations
python3 /app/scripts/validate_translations.py

# Restart frontend
sudo supervisorctl restart frontend

# Check logs if something breaks
tail -f /var/log/supervisor/frontend.out.log
```

## Example Edit

**Before:**
```json
"welcome": "Dobrodošli nazaj, {{name}}"
```

**After:**
```json
"welcome": "Pozdravljeni, {{name}}"
```

Don't forget to restart frontend after saving!

---

**Pro tip**: Make a backup before editing:
```bash
cp /app/frontend/src/i18n/locales/sl.json /app/frontend/src/i18n/locales/sl.json.backup
```
