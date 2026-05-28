
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelUploadPage = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    business_name: '',
    owner_name: '',
    phone_number: '',
    city: '',
    google_reviews: '',
    google_profile_link: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await pb.collection('categories').getFullList({ $autoCancel: false });
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length < 2) {
          alert('File must contain at least a header row and one data row');
          return;
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

        setParsedData({ headers, rows });
        autoMapColumns(headers);
      } catch (error) {
        console.error('Failed to parse file:', error);
        alert('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const autoMapColumns = (headers) => {
    const mapping = {
      business_name: '',
      owner_name: '',
      phone_number: '',
      city: '',
      google_reviews: '',
      google_profile_link: '',
    };

    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('business') || lowerHeader.includes('company') || lowerHeader.includes('name')) {
        if (!mapping.business_name) mapping.business_name = index.toString();
      } else if (lowerHeader.includes('owner') || lowerHeader.includes('contact')) {
        if (!mapping.owner_name) mapping.owner_name = index.toString();
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('number')) {
        if (!mapping.phone_number) mapping.phone_number = index.toString();
      } else if (lowerHeader.includes('city') || lowerHeader.includes('location') || lowerHeader.includes('place')) {
        if (!mapping.city) mapping.city = index.toString();
      } else if (lowerHeader.includes('review') || lowerHeader.includes('rating')) {
        if (!mapping.google_reviews) mapping.google_reviews = index.toString();
      } else if (lowerHeader.includes('link') || lowerHeader.includes('url') || lowerHeader.includes('profile')) {
        if (!mapping.google_profile_link) mapping.google_profile_link = index.toString();
      }
    });

    setColumnMapping(mapping);
  };

  const handleUpload = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    if (!columnMapping.business_name || !columnMapping.phone_number) {
      alert('Business Name and Phone Number columns are required');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    const result = {
      total: parsedData.rows.length,
      success: 0,
      duplicates: 0,
      invalid: 0,
      errors: [],
    };

    const existingPhones = new Set();
    try {
      const existingLeads = await pb.collection('leads').getFullList({
        fields: 'phone_number',
        $autoCancel: false,
      });
      existingLeads.forEach(lead => existingPhones.add(lead.phone_number));
    } catch (error) {
      console.error('Failed to fetch existing leads:', error);
    }

    for (let i = 0; i < parsedData.rows.length; i++) {
      const row = parsedData.rows[i];
      setUploadProgress(Math.round(((i + 1) / parsedData.rows.length) * 100));

      const businessName = row[parseInt(columnMapping.business_name)]?.toString().trim();
      const phoneNumber = row[parseInt(columnMapping.phone_number)]?.toString().trim();

      if (!businessName || !phoneNumber) {
        result.invalid++;
        result.errors.push(`Row ${i + 2}: Missing required fields`);
        continue;
      }

      if (existingPhones.has(phoneNumber)) {
        result.duplicates++;
        continue;
      }

      try {
        const leadData = {
          category_id: selectedCategory,
          business_name: businessName,
          owner_name: columnMapping.owner_name ? row[parseInt(columnMapping.owner_name)]?.toString().trim() || '' : '',
          phone_number: phoneNumber,
          city: columnMapping.city ? row[parseInt(columnMapping.city)]?.toString().trim() || '' : '',
          google_reviews: columnMapping.google_reviews ? parseFloat(row[parseInt(columnMapping.google_reviews)]) || 0 : 0,
          google_profile_link: columnMapping.google_profile_link ? row[parseInt(columnMapping.google_profile_link)]?.toString().trim() || '' : '',
          status: 'Not Contacted',
          created_by: currentUser.id,
        };

        await pb.collection('leads').create(leadData, { $autoCancel: false });
        existingPhones.add(phoneNumber);
        result.success++;
      } catch (error) {
        result.invalid++;
        result.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    try {
      await pb.collection('activity').create(
        {
          user_id: currentUser.id,
          action: 'import_completed',
          details: {
            total: result.total,
            success: result.success,
            duplicates: result.duplicates,
            invalid: result.invalid,
          },
        },
        { $autoCancel: false }
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    setUploadResult(result);
    setUploading(false);
  };

  return (
    <>
      <Helmet>
        <title>Upload Leads - Lead Management CRM</title>
        <meta name="description" content="Upload leads from Excel or CSV files" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
                Upload leads
              </h1>
              <p className="text-muted-foreground">Import leads from Excel or CSV files</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select category</CardTitle>
                  <CardDescription>Choose the category for these leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="text-foreground">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload file</CardTitle>
                  <CardDescription>Select an Excel (.xlsx) or CSV file</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors duration-200">
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-foreground font-medium mb-2">
                          {file ? file.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-muted-foreground">Excel or CSV files only</p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {parsedData.headers && (
                <Card>
                  <CardHeader>
                    <CardTitle>Column mapping</CardTitle>
                    <CardDescription>Map your file columns to lead fields</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Business Name (required)</Label>
                        <Select
                          value={columnMapping.business_name}
                          onValueChange={(val) => setColumnMapping({ ...columnMapping, business_name: val })}
                        >
                          <SelectTrigger className="text-foreground">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {parsedData.headers.map((header, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Phone Number (required)</Label>
                        <Select
                          value={columnMapping.phone_number}
                          onValueChange={(val) => setColumnMapping({ ...columnMapping, phone_number: val })}
                        >
                          <SelectTrigger className="text-foreground">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {parsedData.headers.map((header, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Owner Name (optional)</Label>
                        <Select
                          value={columnMapping.owner_name}
                          onValueChange={(val) => setColumnMapping({ ...columnMapping, owner_name: val })}
                        >
                          <SelectTrigger className="text-foreground">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {parsedData.headers.map((header, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>City (optional)</Label>
                        <Select
                          value={columnMapping.city}
                          onValueChange={(val) => setColumnMapping({ ...columnMapping, city: val })}
                        >
                          <SelectTrigger className="text-foreground">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {parsedData.headers.map((header, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Google Reviews (optional)</Label>
                        <Select
                          value={columnMapping.google_reviews}
                          onValueChange={(val) => setColumnMapping({ ...columnMapping, google_reviews: val })}
                        >
                          <SelectTrigger className="text-foreground">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {parsedData.headers.map((header, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Google Profile Link (optional)</Label>
                        <Select
                          value={columnMapping.google_profile_link}
                          onValueChange={(val) => setColumnMapping({ ...columnMapping, google_profile_link: val })}
                        >
                          <SelectTrigger className="text-foreground">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {parsedData.headers.map((header, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Preview (first row):</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-foreground">
                          <strong>Business:</strong> {parsedData.rows[0]?.[parseInt(columnMapping.business_name)] || '-'}
                        </p>
                        <p className="text-foreground">
                          <strong>Phone:</strong> {parsedData.rows[0]?.[parseInt(columnMapping.phone_number)] || '-'}
                        </p>
                        <p className="text-foreground">
                          <strong>Owner:</strong> {parsedData.rows[0]?.[parseInt(columnMapping.owner_name)] || '-'}
                        </p>
                        <p className="text-foreground">
                          <strong>City:</strong> {parsedData.rows[0]?.[parseInt(columnMapping.city)] || '-'}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedCategory || !columnMapping.business_name || !columnMapping.phone_number}
                      className="w-full mt-6"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : `Upload ${parsedData.rows.length} leads`}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {uploading && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uploading leads...</span>
                        <span className="text-foreground font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {uploadResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upload complete</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total rows</p>
                          <p className="text-2xl font-bold text-foreground">{uploadResult.total}</p>
                        </div>
                        <div className="p-4 bg-success/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Imported</p>
                          <p className="text-2xl font-bold text-success flex items-center">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            {uploadResult.success}
                          </p>
                        </div>
                        <div className="p-4 bg-warning/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Duplicates</p>
                          <p className="text-2xl font-bold text-warning flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {uploadResult.duplicates}
                          </p>
                        </div>
                        <div className="p-4 bg-destructive/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Invalid</p>
                          <p className="text-2xl font-bold text-destructive flex items-center">
                            <XCircle className="w-5 h-5 mr-2" />
                            {uploadResult.invalid}
                          </p>
                        </div>
                      </div>

                      {uploadResult.errors.length > 0 && (
                        <div className="p-4 bg-destructive/10 rounded-lg">
                          <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {uploadResult.errors.slice(0, 10).map((error, index) => (
                              <p key={index} className="text-xs text-destructive">{error}</p>
                            ))}
                            {uploadResult.errors.length > 10 && (
                              <p className="text-xs text-destructive">...and {uploadResult.errors.length - 10} more</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ExcelUploadPage;
