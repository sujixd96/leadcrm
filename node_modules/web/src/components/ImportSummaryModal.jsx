
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const ImportSummaryModal = ({ open, summary, onClose }) => {
  if (!summary) return null;

  const isCompleteSuccess = summary.successfullyImported > 0 && summary.invalidRowsSkipped === 0 && summary.duplicatesSkipped === 0;
  const isPartialSuccess = summary.successfullyImported > 0 && (summary.invalidRowsSkipped > 0 || summary.duplicatesSkipped > 0);
  const isFailure = summary.successfullyImported === 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            {isCompleteSuccess && <CheckCircle2 className="w-8 h-8 text-success" />}
            {isPartialSuccess && <Info className="w-8 h-8 text-info" />}
            {isFailure && <AlertTriangle className="w-8 h-8 text-destructive" />}
            <DialogTitle className="text-xl">Import Complete</DialogTitle>
          </div>
          <DialogDescription>
            {isFailure 
              ? "No leads were imported. Please check the summary below." 
              : `Successfully imported ${summary.successfullyImported} leads into your database.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Rows</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{summary.totalRowsDetected}</p>
            </div>
            <div className="p-4 rounded-xl border border-success/20 bg-success/5">
              <p className="text-xs font-medium text-success uppercase tracking-wider mb-1">Imported</p>
              <p className="text-2xl font-bold text-success tabular-nums">{summary.successfullyImported}</p>
            </div>
            <div className="p-4 rounded-xl border border-warning/20 bg-warning/5">
              <p className="text-xs font-medium text-warning uppercase tracking-wider mb-1">Duplicates</p>
              <p className="text-2xl font-bold text-warning tabular-nums">{summary.duplicatesSkipped}</p>
            </div>
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
              <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-1">Invalid</p>
              <p className="text-2xl font-bold text-destructive tabular-nums">{summary.invalidRowsSkipped}</p>
            </div>
          </div>

          {summary.skippedDetails && summary.skippedDetails.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                Skipped Rows Details
              </h4>
              <ScrollArea className="h-[200px] w-full rounded-md border border-border bg-muted/10">
                <div className="p-4 space-y-3">
                  {summary.skippedDetails.map((detail, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                      <span className="font-medium text-foreground mb-1 sm:mb-0">Row {detail.row}</span>
                      <span className="text-muted-foreground">{detail.reason}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportSummaryModal;
