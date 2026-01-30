"""
EU Invoice Validation Utilities
Supports validation for 8 European countries:
- EN (UK), SL (Slovenia), DE (Germany), FR (France)
- ES (Spain), IT (Italy), PT (Portugal), NL (Netherlands)
"""

import re
from typing import Optional, Tuple

# Country configurations
COUNTRY_CONFIGS = {
    "UK": {
        "name": "United Kingdom",
        "tax_label": "UTR (Unique Taxpayer Reference)",
        "tax_pattern": r"^\d{10}$",
        "tax_example": "1234567890",
        "vat_label": "VAT Number",
        "vat_pattern": r"^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$",
        "vat_example": "GB123456789",
        "iban_pattern": r"^GB\d{2}[A-Z]{4}\d{14}$",
        "iban_example": "GB29NWBK60161331926819",
        "vat_rate": 20.0
    },
    "SI": {
        "name": "Slovenia",
        "tax_label": "Davčna številka (Tax Number)",
        "tax_pattern": r"^\d{8}$",
        "tax_example": "12345678",
        "vat_label": "ID za DDV (VAT ID)",
        "vat_pattern": r"^SI\d{8}$",
        "vat_example": "SI12345678",
        "iban_pattern": r"^SI\d{17}$",
        "iban_example": "SI56012345678901234",
        "vat_rate": 22.0
    },
    "DE": {
        "name": "Germany",
        "tax_label": "Steuernummer (Tax Number)",
        "tax_pattern": r"^\d{10,11}$",
        "tax_example": "12345678901",
        "vat_label": "USt-IdNr. (VAT ID)",
        "vat_pattern": r"^DE\d{9}$",
        "vat_example": "DE123456789",
        "iban_pattern": r"^DE\d{20}$",
        "iban_example": "DE89370400440532013000",
        "vat_rate": 19.0
    },
    "FR": {
        "name": "France",
        "tax_label": "SIRET",
        "tax_pattern": r"^\d{14}$",
        "tax_example": "12345678901234",
        "vat_label": "N° TVA intracommunautaire",
        "vat_pattern": r"^FR[A-Z0-9]{2}\d{9}$",
        "vat_example": "FR12345678901",
        "iban_pattern": r"^FR\d{12}[A-Z0-9]{11}\d{2}$",
        "iban_example": "FR7630006000011234567890189",
        "vat_rate": 20.0
    },
    "ES": {
        "name": "Spain",
        "tax_label": "NIF/CIF",
        "tax_pattern": r"^[A-Z]\d{7}[A-Z0-9]$|^\d{8}[A-Z]$",
        "tax_example": "B12345678 or 12345678A",
        "vat_label": "NIF-IVA",
        "vat_pattern": r"^ES[A-Z0-9]\d{7}[A-Z0-9]$",
        "vat_example": "ESB12345678",
        "iban_pattern": r"^ES\d{22}$",
        "iban_example": "ES9121000418450200051332",
        "vat_rate": 21.0
    },
    "IT": {
        "name": "Italy",
        "tax_label": "Codice Fiscale / P.IVA",
        "tax_pattern": r"^\d{11}$|^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$",
        "tax_example": "12345678901",
        "vat_label": "Partita IVA",
        "vat_pattern": r"^IT\d{11}$",
        "vat_example": "IT12345678901",
        "iban_pattern": r"^IT\d{2}[A-Z]\d{22}$",
        "iban_example": "IT60X0542811101000000123456",
        "vat_rate": 22.0
    },
    "PT": {
        "name": "Portugal",
        "tax_label": "NIF (Número de Identificação Fiscal)",
        "tax_pattern": r"^\d{9}$",
        "tax_example": "123456789",
        "vat_label": "NIF/NIPC",
        "vat_pattern": r"^PT\d{9}$",
        "vat_example": "PT123456789",
        "iban_pattern": r"^PT\d{23}$",
        "iban_example": "PT50000201231234567890154",
        "vat_rate": 23.0
    },
    "NL": {
        "name": "Netherlands",
        "tax_label": "BSN/RSIN",
        "tax_pattern": r"^\d{9}$",
        "tax_example": "123456789",
        "vat_label": "BTW-nummer",
        "vat_pattern": r"^NL\d{9}B\d{2}$",
        "vat_example": "NL123456789B01",
        "iban_pattern": r"^NL\d{2}[A-Z]{4}\d{10}$",
        "iban_example": "NL91ABNA0417164300",
        "vat_rate": 21.0
    }
}

# Map language codes to country codes
LANGUAGE_TO_COUNTRY = {
    "en": "UK",
    "sl": "SI",
    "de": "DE",
    "fr": "FR",
    "es": "ES",
    "it": "IT",
    "pt": "PT",
    "nl": "NL"
}


def get_country_config(country_code: str) -> dict:
    """Get validation configuration for a country."""
    code = country_code.upper()
    return COUNTRY_CONFIGS.get(code, COUNTRY_CONFIGS["SI"])  # Default to Slovenia


def get_country_from_language(language_code: str) -> str:
    """Get country code from language code."""
    return LANGUAGE_TO_COUNTRY.get(language_code.lower(), "SI")


def validate_tax_number(tax_number: str, country_code: str) -> Tuple[bool, Optional[str]]:
    """
    Validate tax number for a specific country.
    Returns (is_valid, error_message)
    """
    if not tax_number:
        return True, None  # Optional field
    
    config = get_country_config(country_code)
    pattern = config["tax_pattern"]
    
    # Remove spaces and dashes
    cleaned = re.sub(r'[\s\-]', '', tax_number.upper())
    
    if re.match(pattern, cleaned):
        return True, None
    else:
        return False, f"Invalid {config['tax_label']}. Expected format: {config['tax_example']}"


def validate_vat_number(vat_number: str, country_code: str) -> Tuple[bool, Optional[str]]:
    """
    Validate VAT number for a specific country.
    Returns (is_valid, error_message)
    """
    if not vat_number:
        return True, None  # Optional field
    
    config = get_country_config(country_code)
    pattern = config["vat_pattern"]
    
    # Remove spaces and dashes
    cleaned = re.sub(r'[\s\-]', '', vat_number.upper())
    
    if re.match(pattern, cleaned):
        return True, None
    else:
        return False, f"Invalid {config['vat_label']}. Expected format: {config['vat_example']}"


def validate_iban(iban: str, country_code: str = None) -> Tuple[bool, Optional[str]]:
    """
    Validate IBAN format.
    Returns (is_valid, error_message)
    """
    if not iban:
        return True, None  # Optional field
    
    # Remove spaces
    cleaned = re.sub(r'\s', '', iban.upper())
    
    # Basic IBAN validation (length and format)
    if len(cleaned) < 15 or len(cleaned) > 34:
        return False, "IBAN must be between 15 and 34 characters"
    
    if not re.match(r'^[A-Z]{2}\d{2}[A-Z0-9]+$', cleaned):
        return False, "Invalid IBAN format. Must start with 2 letters, then 2 digits"
    
    # Country-specific validation if country provided
    if country_code:
        config = get_country_config(country_code)
        pattern = config.get("iban_pattern")
        if pattern and not re.match(pattern, cleaned):
            return False, f"Invalid IBAN for {config['name']}. Expected format: {config['iban_example']}"
    
    # IBAN checksum validation (ISO 7064 Mod 97-10)
    rearranged = cleaned[4:] + cleaned[:4]
    numeric = ''
    for char in rearranged:
        if char.isdigit():
            numeric += char
        else:
            numeric += str(ord(char) - ord('A') + 10)
    
    if int(numeric) % 97 != 1:
        return False, "Invalid IBAN checksum"
    
    return True, None


def validate_bic(bic: str) -> Tuple[bool, Optional[str]]:
    """
    Validate BIC/SWIFT code.
    Returns (is_valid, error_message)
    """
    if not bic:
        return True, None  # Optional field
    
    # Remove spaces
    cleaned = re.sub(r'\s', '', bic.upper())
    
    # BIC format: 4 letters (bank) + 2 letters (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch)
    if not re.match(r'^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$', cleaned):
        return False, "Invalid BIC/SWIFT format. Expected: AAAABBCC or AAAABBCCDDD"
    
    return True, None


def validate_invoice_settings(
    country_code: str,
    tax_number: str = None,
    vat_number: str = None,
    iban: str = None,
    bic: str = None
) -> dict:
    """
    Validate all invoice settings for a country.
    Returns dict with validation results for each field.
    """
    results = {
        "valid": True,
        "errors": {},
        "country": get_country_config(country_code)["name"],
        "vat_rate": get_country_config(country_code)["vat_rate"]
    }
    
    # Validate tax number
    is_valid, error = validate_tax_number(tax_number, country_code)
    if not is_valid:
        results["valid"] = False
        results["errors"]["taxNumber"] = error
    
    # Validate VAT number
    is_valid, error = validate_vat_number(vat_number, country_code)
    if not is_valid:
        results["valid"] = False
        results["errors"]["vatNumber"] = error
    
    # Validate IBAN
    is_valid, error = validate_iban(iban, country_code)
    if not is_valid:
        results["valid"] = False
        results["errors"]["iban"] = error
    
    # Validate BIC
    is_valid, error = validate_bic(bic)
    if not is_valid:
        results["valid"] = False
        results["errors"]["bic"] = error
    
    return results


def get_country_requirements(country_code: str) -> dict:
    """
    Get field requirements and examples for a specific country.
    Useful for frontend to show country-specific help text.
    """
    config = get_country_config(country_code)
    return {
        "country": config["name"],
        "taxNumber": {
            "label": config["tax_label"],
            "example": config["tax_example"],
            "required": False
        },
        "vatNumber": {
            "label": config["vat_label"],
            "example": config["vat_example"],
            "required": False
        },
        "iban": {
            "example": config["iban_example"],
            "required": False
        },
        "vatRate": config["vat_rate"]
    }


def get_all_country_configs() -> dict:
    """Get configurations for all supported countries."""
    return {
        code: {
            "name": config["name"],
            "taxLabel": config["tax_label"],
            "taxExample": config["tax_example"],
            "vatLabel": config["vat_label"],
            "vatExample": config["vat_example"],
            "ibanExample": config["iban_example"],
            "vatRate": config["vat_rate"]
        }
        for code, config in COUNTRY_CONFIGS.items()
    }
