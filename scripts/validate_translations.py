#!/usr/bin/env python3
"""
Translation File Validator
Checks all translation files for:
- Valid JSON syntax
- Missing keys compared to English base
- Extra keys not in English base
- Missing variable placeholders
- Consistent variable usage
"""

import json
import os
import sys
from pathlib import Path

def load_json(filepath):
    """Load JSON file and return dict"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ JSON Error in {filepath}: {e}")
        return None
    except Exception as e:
        print(f"❌ Error loading {filepath}: {e}")
        return None

def get_all_keys(obj, prefix=''):
    """Recursively get all keys from nested dict"""
    keys = []
    for key, value in obj.items():
        if key.startswith('_'):  # Skip metadata keys
            continue
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.extend(get_all_keys(value, full_key))
        else:
            keys.append(full_key)
    return keys

def find_variables(text):
    """Find all {{variable}} placeholders in text"""
    import re
    if not isinstance(text, str):
        return []
    return re.findall(r'\{\{(\w+)\}\}', text)

def get_value_at_path(obj, path):
    """Get value from nested dict using dot notation path"""
    keys = path.split('.')
    value = obj
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return None
    return value

def validate_translations(locales_dir):
    """Validate all translation files against English base"""
    
    # Load English as base
    en_path = locales_dir / 'en.json'
    en_data = load_json(en_path)
    if not en_data:
        print("❌ Cannot load English base file")
        return False
    
    en_keys = set(get_all_keys(en_data))
    print(f"✓ English base has {len(en_keys)} translation keys\n")
    
    # Get all language files
    lang_files = list(locales_dir.glob('*.json'))
    lang_files = [f for f in lang_files if f.name != 'en.json']
    
    all_valid = True
    
    for lang_file in sorted(lang_files):
        lang_code = lang_file.stem
        print(f"\n{'='*60}")
        print(f"Validating: {lang_code.upper()} ({lang_file.name})")
        print('='*60)
        
        lang_data = load_json(lang_file)
        if not lang_data:
            all_valid = False
            continue
        
        lang_keys = set(get_all_keys(lang_data))
        
        # Check for missing keys
        missing_keys = en_keys - lang_keys
        if missing_keys:
            print(f"\n⚠️  Missing {len(missing_keys)} translations:")
            for key in sorted(missing_keys)[:10]:  # Show first 10
                print(f"   - {key}")
            if len(missing_keys) > 10:
                print(f"   ... and {len(missing_keys) - 10} more")
            all_valid = False
        else:
            print("✓ All keys present")
        
        # Check for extra keys
        extra_keys = lang_keys - en_keys
        if extra_keys:
            print(f"\n⚠️  Extra {len(extra_keys)} keys not in English:")
            for key in sorted(extra_keys):
                print(f"   - {key}")
            all_valid = False
        
        # Check variable consistency
        print("\nChecking variable placeholders...")
        variable_mismatches = []
        for key in en_keys & lang_keys:  # Only check common keys
            en_value = get_value_at_path(en_data, key)
            lang_value = get_value_at_path(lang_data, key)
            
            en_vars = set(find_variables(en_value))
            lang_vars = set(find_variables(lang_value))
            
            if en_vars != lang_vars:
                variable_mismatches.append({
                    'key': key,
                    'en_vars': en_vars,
                    'lang_vars': lang_vars,
                    'en_value': en_value,
                    'lang_value': lang_value
                })
        
        if variable_mismatches:
            print(f"⚠️  Found {len(variable_mismatches)} variable mismatches:")
            for mismatch in variable_mismatches[:5]:  # Show first 5
                print(f"\n   Key: {mismatch['key']}")
                print(f"   English vars: {mismatch['en_vars']}")
                print(f"   {lang_code} vars: {mismatch['lang_vars']}")
                missing = mismatch['en_vars'] - mismatch['lang_vars']
                extra = mismatch['lang_vars'] - mismatch['en_vars']
                if missing:
                    print(f"   Missing: {missing}")
                if extra:
                    print(f"   Extra: {extra}")
            if len(variable_mismatches) > 5:
                print(f"\n   ... and {len(variable_mismatches) - 5} more")
            all_valid = False
        else:
            print("✓ All variables match")
        
        # Summary
        completion = (len(lang_keys) / len(en_keys) * 100) if en_keys else 0
        print(f"\n📊 Summary:")
        print(f"   Completion: {completion:.1f}%")
        print(f"   Total keys: {len(lang_keys)}/{len(en_keys)}")
        
        if not missing_keys and not extra_keys and not variable_mismatches:
            print(f"\n✅ {lang_code.upper()} translations are valid!")
        else:
            print(f"\n⚠️  {lang_code.upper()} needs attention")
    
    print(f"\n{'='*60}")
    if all_valid:
        print("✅ All translation files are valid!")
    else:
        print("⚠️  Some translation files need attention")
    print('='*60)
    
    return all_valid

if __name__ == '__main__':
    locales_dir = Path('/app/frontend/src/i18n/locales')
    
    if not locales_dir.exists():
        print(f"❌ Locales directory not found: {locales_dir}")
        sys.exit(1)
    
    valid = validate_translations(locales_dir)
    sys.exit(0 if valid else 1)
