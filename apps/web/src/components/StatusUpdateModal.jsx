
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';

const statusOptions = [
  { value: 'Not Contacted', color: 'bg-muted text-muted-foreground' },
  { value: 'Called', color: 'bg-info text-info-foreground' },
  { value: 'Interested', color: 'bg-info text-info-foreground' },
  { value: 'Follow Up', color: 'bg-warning text-warning-foreground' },
  { value: 'Converted', color: 'bg-success text-success-foreground' },
  { value: 'Rejected', color: 'bg-destructive text-destructive-foreground' },
];

const StatusUpdateModal = ({ open, onClose, lead, onUpdate }) => {
  const { currentUser } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(lead?.status || 'Not Contacted');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!lead) return;

    setLoading(true);
    try {
      const updatedLead = await pb.collection('leads').update(
        lead.id,
        {
          status: selectedStatus,
          called_at: selectedStatus === 'Called' ? new Date().toISOString() : lead.called_at,
        },
        { $autoCancel: false }
      );

      await pb.collection('activity').create(
        {
          user_id: currentUser.id,
          action: 'status_changed',
          lead_id: lead.id,
          details: {
            old_status: lead.status,
            new_status: selectedStatus,
            note: note || null,
          },
        },
        { $autoCancel: false }
      );

      onUpdate(updatedLead);
      onClose();
      setNote('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update lead status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Current status</p>
            <Badge className={statusOptions.find(s => s.value === lead?.status)?.color}>
              {lead?.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-3">Select new status</p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedStatus === status.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Badge className={status.color}>{status.value}</Badge>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Add note (optional)</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional notes..."
              className="min-h-[80px] text-foreground"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateModal;
