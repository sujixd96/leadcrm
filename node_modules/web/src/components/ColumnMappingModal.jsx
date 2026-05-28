
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MAPPING_FIELDS = [
  { key: 'business_name', label: 'Business Name', required: true },
  { key: 'phone_number', label: 'Phone Number', required: true },
  { key: 'owner_name', label: 'Owner Name', required: false },
  { key: 'city', label: 'City / Place', required: false },
  { key: 'google_reviews', label: 'Google Reviews', required: false },
  { key: 'google_profile_link', label: 'Google Profile Link', required: false },
];

const ColumnMappingModal = ({ open, headers, rows, initialMapping, onConfirm, onCancel }) => {
  const [mapping, setMapping] = useState(initialMapping || {});

  const handleMappingChange = (fieldKey, columnIndex) => {
    setMapping(prev => ({ ...prev, [fieldKey]: columnIndex === 'none' ? '' : columnIndex }));
  };

  const isValid = mapping.business_name !== '' && mapping.phone_number !== '';

  const previewRows = rows?.slice(0, 3) || [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map your columns</DialogTitle>
          <DialogDescription>
            We've auto-detected some columns. Please verify and map any missing fields before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MAPPING_FIELDS.map(field => (
              <div key={field.key} className="space-y-2">
                <Label className="flex items-center">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Select
                  value={mapping[field.key] || 'none'}
                  onValueChange={(val) => handleMappingChange(field.key, val)}
                >
                  <SelectTrigger className={`w-full text-foreground ${!mapping[field.key] && field.required ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Skip this field --</SelectItem>
                    {headers.map((header, index) => (
                      <SelectItem key={index} value={String(index)}>
                        Column {index + 1}: {header || `(Empty Header)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b border-border">
              <h4 className="font-medium text-sm text-foreground">Data Preview (First 3 rows)</h4>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {MAPPING_FIELDS.map(field => (
                      <TableHead key={field.key} className="whitespace-nowrap">
                        {field.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {MAPPING_FIELDS.map(field => {
                        const colIndex = mapping[field.key];
                        const cellValue = colIndex && colIndex !== 'none' ? row[parseInt(colIndex)] : '-';
                        return (
                          <TableCell key={field.key} className="truncate max-w-[200px]">
                            {cellValue || '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(mapping)} disabled={!isValid}>
            Confirm Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnMappingModal;
