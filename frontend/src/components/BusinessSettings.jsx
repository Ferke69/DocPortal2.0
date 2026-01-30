import React, { useState, useEffect } from 'react';
import { Building2, Upload, Save, Trash2, FileText, CreditCard, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { providerSettingsApi } from '../services/api';
import { toast } from '../hooks/use-toast';

// Country configurations for validation
const COUNTRY_CONFIGS = {
  "UK": { name: "United Kingdom", taxLabel: "UTR", taxExample: "1234567890", vatLabel: "VAT Number", vatExample: "GB123456789", ibanExample: "GB29NWBK60161331926819", vatRate: 20.0 },
  "SI": { name: "Slovenia", taxLabel: "Davčna številka", taxExample: "12345678", vatLabel: "ID za DDV", vatExample: "SI12345678", ibanExample: "SI56012345678901234", vatRate: 22.0 },
  "DE": { name: "Germany", taxLabel: "Steuernummer", taxExample: "12345678901", vatLabel: "USt-IdNr.", vatExample: "DE123456789", ibanExample: "DE89370400440532013000", vatRate: 19.0 },
  "FR": { name: "France", taxLabel: "SIRET", taxExample: "12345678901234", vatLabel: "N° TVA", vatExample: "FR12345678901", ibanExample: "FR7630006000011234567890189", vatRate: 20.0 },
  "ES": { name: "Spain", taxLabel: "NIF/CIF", taxExample: "B12345678", vatLabel: "NIF-IVA", vatExample: "ESB12345678", ibanExample: "ES9121000418450200051332", vatRate: 21.0 },
  "IT": { name: "Italy", taxLabel: "Codice Fiscale", taxExample: "12345678901", vatLabel: "Partita IVA", vatExample: "IT12345678901", ibanExample: "IT60X0542811101000000123456", vatRate: 22.0 },
  "PT": { name: "Portugal", taxLabel: "NIF", taxExample: "123456789", vatLabel: "NIF/NIPC", vatExample: "PT123456789", ibanExample: "PT50000201231234567890154", vatRate: 23.0 },
  "NL": { name: "Netherlands", taxLabel: "BSN/RSIN", taxExample: "123456789", vatLabel: "BTW-nummer", vatExample: "NL123456789B01", ibanExample: "NL91ABNA0417164300", vatRate: 21.0 }
};

const COUNTRY_NAME_TO_CODE = {
  "United Kingdom": "UK", "UK": "UK",
  "Slovenia": "SI", "Slovenija": "SI",
  "Germany": "DE", "Deutschland": "DE",
  "France": "FR",
  "Spain": "ES", "España": "ES",
  "Italy": "IT", "Italia": "IT",
  "Portugal": "PT",
  "Netherlands": "NL", "Nederland": "NL"
};

const BusinessSettings = ({ showHeader = true }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedCountryCode, setSelectedCountryCode] = useState('SI');
  const [settings, setSettings] = useState({
    businessName: '',
    businessAddress: '',
    city: '',
    postalCode: '',
    country: 'Slovenia',
    taxNumber: '',
    vatNumber: '',
    registrationNumber: '',
    bankName: '',
    iban: '',
    bic: '',
    invoicePrefix: 'INV',
    defaultPaymentTermDays: 15,
    vatRate: 22.0,
    logoUrl: '',
    businessEmail: '',
    businessPhone: '',
    website: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Update country code when country changes
    const code = COUNTRY_NAME_TO_CODE[settings.country] || 'SI';
    setSelectedCountryCode(code);
    
    // Update VAT rate based on country
    const config = COUNTRY_CONFIGS[code];
    if (config && settings.vatRate !== config.vatRate) {
      setSettings(prev => ({ ...prev, vatRate: config.vatRate }));
    }
  }, [settings.country]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await providerSettingsApi.getBusinessSettings();
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCountryConfig = () => COUNTRY_CONFIGS[selectedCountryCode] || COUNTRY_CONFIGS['SI'];

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await providerSettingsApi.updateBusinessSettings(settings);
      toast({
        title: "Settings saved",
        description: "Your business settings have been updated successfully."
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 2MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingLogo(true);
      const response = await providerSettingsApi.uploadLogo(file);
      setSettings(prev => ({ ...prev, logoUrl: response.data.logoUrl }));
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully."
      });
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await providerSettingsApi.deleteLogo();
      setSettings(prev => ({ ...prev, logoUrl: '' }));
      toast({
        title: "Logo removed",
        description: "Your logo has been removed."
      });
    } catch (err) {
      console.error('Error deleting logo:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Business Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Configure your business details for invoicing (EU/Slovenia compliant)</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
      {!showHeader && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Logo Upload */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Upload className="h-5 w-5 mr-2 text-blue-600" />
            Business Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            {settings.logoUrl ? (
              <div className="relative">
                <img 
                  src={settings.logoUrl} 
                  alt="Business Logo" 
                  className="h-24 w-auto max-w-48 object-contain border rounded-lg"
                />
                <button
                  onClick={handleDeleteLogo}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-24 w-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">No logo uploaded</span>
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload">
                <Button variant="outline" asChild disabled={uploadingLogo}>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Max 2MB. JPEG, PNG, or WebP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Building2 className="h-5 w-5 mr-2 text-green-600" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Business Name / Naziv podjetja</Label>
            <Input
              value={settings.businessName || ''}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Your Practice Name"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Address / Naslov</Label>
            <Input
              value={settings.businessAddress || ''}
              onChange={(e) => handleInputChange('businessAddress', e.target.value)}
              placeholder="Street address"
              className="mt-1"
            />
          </div>
          <div>
            <Label>City / Mesto</Label>
            <Input
              value={settings.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Ljubljana"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Postal Code / Poštna številka</Label>
            <Input
              value={settings.postalCode || ''}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="1000"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Country / Država</Label>
            <Input
              value={settings.country || 'Slovenia'}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Business Email</Label>
            <Input
              type="email"
              value={settings.businessEmail || ''}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              placeholder="info@yourpractice.si"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Business Phone</Label>
            <Input
              value={settings.businessPhone || ''}
              onChange={(e) => handleInputChange('businessPhone', e.target.value)}
              placeholder="+386 1 234 5678"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={settings.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://www.yourpractice.si"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <FileText className="h-5 w-5 mr-2 text-purple-600" />
            Tax Information / Davčni podatki
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tax Number / Davčna številka</Label>
            <Input
              value={settings.taxNumber || ''}
              onChange={(e) => handleInputChange('taxNumber', e.target.value)}
              placeholder="12345678"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">8-digit Slovenian tax number</p>
          </div>
          <div>
            <Label>VAT ID / ID za DDV</Label>
            <Input
              value={settings.vatNumber || ''}
              onChange={(e) => handleInputChange('vatNumber', e.target.value)}
              placeholder="SI12345678"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">SI + 8 digits for EU VAT</p>
          </div>
          <div>
            <Label>Registration Number / Matična številka</Label>
            <Input
              value={settings.registrationNumber || ''}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              placeholder="1234567000"
              className="mt-1"
            />
          </div>
          <div>
            <Label>VAT Rate / DDV stopnja (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={settings.vatRate || 22}
              onChange={(e) => handleInputChange('vatRate', parseFloat(e.target.value))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Slovenia standard: 22%</p>
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
            Banking Details / Bančni podatki
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Bank Name / Ime banke</Label>
            <Input
              value={settings.bankName || ''}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder="NLB d.d."
              className="mt-1"
            />
          </div>
          <div>
            <Label>IBAN</Label>
            <Input
              value={settings.iban || ''}
              onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase())}
              placeholder="SI56 0123 4567 8901 234"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label>BIC/SWIFT</Label>
            <Input
              value={settings.bic || ''}
              onChange={(e) => handleInputChange('bic', e.target.value.toUpperCase())}
              placeholder="LJBASI2X"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label>Payment Terms (days) / Rok plačila</Label>
            <Input
              type="number"
              value={settings.defaultPaymentTermDays || 15}
              onChange={(e) => handleInputChange('defaultPaymentTermDays', parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Globe className="h-5 w-5 mr-2 text-teal-600" />
            Invoice Settings / Nastavitve računa
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Invoice Prefix / Predpona računa</Label>
            <Input
              value={settings.invoicePrefix || 'INV'}
              onChange={(e) => handleInputChange('invoicePrefix', e.target.value.toUpperCase())}
              placeholder="INV"
              className="mt-1 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Example: INV-2025-00001</p>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">EU/Slovenian Invoice Requirements</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Invoices must include your tax number (davčna številka) and VAT ID if applicable</li>
          <li>• IBAN is required for EU bank transfers (SEPA payments)</li>
          <li>• Standard VAT rate in Slovenia is 22% (reduced rates: 9.5% and 5%)</li>
          <li>• Invoice must show net amount, VAT amount, and gross total</li>
        </ul>
      </div>
    </div>
  );
};

export default BusinessSettings;
