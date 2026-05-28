
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const DuplicateDetectionModal = ({ open, duplicates, validLeads, onConfirm, onCancel }) => {
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const totalDetected = duplicates.length + validLeads.length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Duplicate Check Results</DialogTitle>
          <DialogDescription>
            We checked your upload against existing leads in this category using phone numbers.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New / Valid</p>
                <p className="text-2xl font-bold text-foreground mt-1">{validLeads.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success opacity-20" />
            </div>
            <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duplicates</p>
                <p className="text-2xl font-bold text-foreground mt-1">{duplicates.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning opacity-20" />
            </div>
          </div>

          {duplicates.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border border-border">
                <Checkbox 
                  id="skip-duplicates" 
                  checked={skipDuplicates} 
                  onCheckedChange={(checked) => setSkipDuplicates(checked)}
                />
                <label 
                  htmlFor="skip-duplicates" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground cursor-pointer"
                >
                  Skip duplicate leads (Recommended)
                </label>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                  Detected Duplicates
                  <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">Preview</Badge>
                </h4>
                <ScrollArea className="h-[200px] w-full rounded-md border border-border">
                  <div className="p-4 space-y-3">
                    {duplicates.slice(0, 50).map((lead, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                        <span className="font-medium text-foreground truncate mr-4">{lead.business_name}</span>
                        <span className="text-muted-foreground tabular-nums whitespace-nowrap">{lead.phone_number}</span>
                      </div>
                    ))}
                    {duplicates.length > 50 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">...and {duplicates.length - 50} more</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-success/10 rounded-xl border border-success/20">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No duplicates found!</h3>
              <p className="text-sm text-muted-foreground mt-1">All {totalDetected} leads appear to be new.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>Cancel Upload</Button>
          <Button onClick={() => onConfirm(skipDuplicates)}>
            Continue to Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateDetectionModal;
