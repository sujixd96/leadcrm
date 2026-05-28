
import { useState } from 'react';
import { parseFile } from '@/lib/fileParser.js';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const useLeadUpload = () => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState('idle');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validLeads, setValidLeads] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const startUpload = async (uploadFile, categoryId) => {
    try {
      setIsLoading(true);
      setError(null);
      setFile(uploadFile);
      setCurrentCategoryId(categoryId);
      
      const data = await parseFile(uploadFile);
      setParsedData(data);
      setStep('mapping');
    } catch (err) {
      setError(err.message || 'Failed to parse file');
      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMapping = async (finalMapping) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { rows } = parsedData;
      const tempValid = [];
      const tempInvalid = [];

      // Process mapped rows
      rows.forEach((row, index) => {
        const businessName = finalMapping.business_name ? row[parseInt(finalMapping.business_name)] : '';
        const phoneNumber = finalMapping.phone_number ? row[parseInt(finalMapping.phone_number)] : '';

        if (!businessName || !phoneNumber) {
          tempInvalid.push({ 
            row: index + 2, 
            reason: 'Missing required Business Name or Phone Number' 
          });
          return;
        }

        tempValid.push({
          originalRowIndex: index + 2,
          business_name: businessName,
          owner_name: finalMapping.owner_name ? row[parseInt(finalMapping.owner_name)] : '',
          phone_number: phoneNumber,
          city: finalMapping.city ? row[parseInt(finalMapping.city)] : '',
          google_reviews: finalMapping.google_reviews ? (Number(row[parseInt(finalMapping.google_reviews)]) || 0) : 0,
          google_profile_link: finalMapping.google_profile_link ? row[parseInt(finalMapping.google_profile_link)] : '',
        });
      });

      // Fetch existing leads for duplicate detection within this category
      const existingLeadsRes = await pb.collection('leads').getList(1, 5000, {
        filter: `category_id="${currentCategoryId}"`,
        $autoCancel: false
      });

      const existingPhones = new Set(existingLeadsRes.items.map(l => l.phone_number));

      const finalValid = [];
      const tempDuplicates = [];

      tempValid.forEach(lead => {
        if (existingPhones.has(lead.phone_number)) {
          tempDuplicates.push(lead);
        } else {
          finalValid.push(lead);
        }
      });

      setValidLeads(finalValid);
      setDuplicates(tempDuplicates);
      setInvalidRows(tempInvalid);
      
      setStep('duplicates');
    } catch (err) {
      setError(err.message || 'Error processing mapped data');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDuplicates = async (skipDuplicates) => {
    try {
      setStep('uploading');
      setIsLoading(true);
      setError(null);

      const leadsToImport = skipDuplicates ? [...validLeads] : [...validLeads, ...duplicates];
      setUploadProgress({ current: 0, total: leadsToImport.length });

      const importResults = {
        totalRowsDetected: parsedData.rows.length,
        successfullyImported: 0,
        duplicatesSkipped: skipDuplicates ? duplicates.length : 0,
        invalidRowsSkipped: invalidRows.length,
        skippedDetails: [...invalidRows],
        missingRequiredCount: invalidRows.length
      };

      if (skipDuplicates) {
        duplicates.forEach(d => {
          importResults.skippedDetails.push({ 
            row: d.originalRowIndex, 
            reason: `Duplicate phone number: ${d.phone_number}` 
          });
        });
      }

      // Upload sequentially to ensure stability and accurate progress
      for (let i = 0; i < leadsToImport.length; i++) {
        const lead = leadsToImport[i];
        try {
          await pb.collection('leads').create({
            category_id: currentCategoryId,
            business_name: lead.business_name,
            owner_name: lead.owner_name,
            phone_number: lead.phone_number,
            city: lead.city,
            google_reviews: lead.google_reviews,
            google_profile_link: lead.google_profile_link,
            status: 'Not Contacted',
            notes: [],
            created_by: currentUser.id
          }, { $autoCancel: false });
          importResults.successfullyImported++;
        } catch (err) {
          importResults.invalidRowsSkipped++;
          importResults.skippedDetails.push({ 
            row: lead.originalRowIndex, 
            reason: `Database error: ${err.message}` 
          });
        }
        setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      setSummary(importResults);
      setStep('summary');
    } catch (err) {
      setError(err.message || 'Failed to upload leads');
      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('idle');
    setFile(null);
    setParsedData(null);
    setValidLeads([]);
    setDuplicates([]);
    setInvalidRows([]);
    setSummary(null);
    setError(null);
    setCurrentCategoryId(null);
    setUploadProgress({ current: 0, total: 0 });
  };

  return {
    step,
    file,
    parsedData,
    duplicates,
    validLeads,
    summary,
    isLoading,
    error,
    uploadProgress,
    startUpload,
    confirmMapping,
    confirmDuplicates,
    reset
  };
};
