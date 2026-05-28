
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { useLeadUpload } from '@/hooks/useLeadUpload.js';
import ColumnMappingModal from '@/components/ColumnMappingModal.jsx';
import DuplicateDetectionModal from '@/components/DuplicateDetectionModal.jsx';
import ImportSummaryModal from '@/components/ImportSummaryModal.jsx';
import { toast } from 'sonner';

const UploadModal = ({ open, onOpenChange, categoryId, onUploadComplete }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    step,
    parsedData,
    duplicates,
    validLeads,
    summary,
    error,
    uploadProgress,
    startUpload,
    confirmMapping,
    confirmDuplicates,
    reset
  } = useLeadUpload();

  const handleClose = () => {
    reset();
    setIsDragging(false);
    onOpenChange(false);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      toast.error('Invalid file type. Please upload a .csv or .xlsx file.');
      return;
    }
    
    startUpload(file, categoryId);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleSummaryClose = () => {
    handleClose();
    if (summary && summary.successfullyImported > 0) {
      toast.success(`Successfully imported ${summary.successfullyImported} leads`);
      onUploadComplete();
    }
  };

  // Render appropriate child modal based on step
  if (step === 'mapping') {
    return (
      <ColumnMappingModal 
        open={true} 
        headers={parsedData.headers} 
        rows={parsedData.rows} 
        initialMapping={parsedData.columnMapping}
        onConfirm={confirmMapping}
        onCancel={handleClose}
      />
    );
  }

  if (step === 'duplicates') {
    return (
      <DuplicateDetectionModal 
        open={true}
        duplicates={duplicates}
        validLeads={validLeads}
        onConfirm={confirmDuplicates}
        onCancel={handleClose}
      />
    );
  }

  if (step === 'summary') {
    return (
      <ImportSummaryModal 
        open={true}
        summary={summary}
        onClose={handleSummaryClose}
      />
    );
  }

  // Handle uploading progress state inline
  const isProcessing = step === 'parsing' || step === 'uploading';
  const progressPercent = uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0;

  // Base Drag and Drop Modal
  return (
    <Dialog open={open && step === 'idle'} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Leads</DialogTitle>
          <DialogDescription>
            Import leads via Excel (.xlsx) or CSV format.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start text-destructive text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-foreground font-medium">
                  {step === 'uploading' ? 'Saving leads to database...' : 'Reading file...'}
                </p>
                {step === 'uploading' && uploadProgress.total > 0 && (
                  <div className="mt-4 w-full max-w-xs mx-auto space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{uploadProgress.current} / {uploadProgress.total}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`
                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/10'}
              `}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1 text-center">
                Drag & drop your file here
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Supported formats: .xlsx, .csv
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileSelect} 
                accept=".xlsx,.csv" 
                className="hidden" 
              />
              
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
