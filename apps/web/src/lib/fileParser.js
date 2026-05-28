
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export const parseFile = async (file) => {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          processRawData(results.data, resolve, reject);
        },
        error: (err) => reject(new Error(`CSV Parse Error: ${err.message}`))
      });
    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          processRawData(jsonData, resolve, reject);
        } catch (err) {
          reject(new Error(`Excel Parse Error: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file format. Please upload .xlsx or .csv"));
    }
  });
};

const processRawData = (data, resolve, reject) => {
  if (!data || data.length < 2) {
    reject(new Error("File must contain at least a header row and one data row"));
    return;
  }

  // Extract and trim headers
  const headers = data[0].map(h => (h !== undefined && h !== null ? String(h).trim() : ''));
  
  // Extract and trim rows, filtering out completely empty rows
  const rows = data.slice(1)
    .filter(row => row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
    .map(row => row.map(cell => (cell !== undefined && cell !== null ? String(cell).trim() : '')));

  // Auto-detect columns
  const columnMapping = {
    business_name: '',
    owner_name: '',
    phone_number: '',
    city: '',
    google_reviews: '',
    google_profile_link: '',
  };

  headers.forEach((h, index) => {
    const lower = h.toLowerCase();
    
    if (!columnMapping.business_name && (lower.includes('business') || lower.includes('company') || lower.includes('name') && !lower.includes('owner'))) {
      columnMapping.business_name = String(index);
    } else if (!columnMapping.owner_name && (lower.includes('owner') || lower.includes('contact'))) {
      columnMapping.owner_name = String(index);
    } else if (!columnMapping.phone_number && (lower.includes('phone') || lower.includes('mobile') || lower.includes('number'))) {
      columnMapping.phone_number = String(index);
    } else if (!columnMapping.city && (lower.includes('city') || lower.includes('location') || lower.includes('place'))) {
      columnMapping.city = String(index);
    } else if (!columnMapping.google_reviews && (lower.includes('review') || lower.includes('rating'))) {
      columnMapping.google_reviews = String(index);
    } else if (!columnMapping.google_profile_link && (lower.includes('link') || lower.includes('url') || lower.includes('profile'))) {
      columnMapping.google_profile_link = String(index);
    }
  });

  const errors = [];
  if (!columnMapping.business_name) errors.push("Could not auto-detect 'Business Name' column.");
  if (!columnMapping.phone_number) errors.push("Could not auto-detect 'Phone Number' column.");

  resolve({ headers, rows, columnMapping, errors });
};
