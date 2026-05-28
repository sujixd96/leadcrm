
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Plus } from 'lucide-react';

const NotesPanel = ({ lead, onUpdate }) => {
  const { currentUser } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const notes = Array.isArray(lead?.notes) ? lead.notes : [];

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;

    setLoading(true);
    try {
      const noteEntry = {
        text: newNote,
        user_id: currentUser.id,
        user_name: currentUser.name,
        timestamp: new Date().toISOString(),
      };

      const updatedNotes = [...notes, noteEntry];

      const updatedLead = await pb.collection('leads').update(
        lead.id,
        { notes: updatedNotes },
        { $autoCancel: false }
      );

      await pb.collection('activity').create(
        {
          user_id: currentUser.id,
          action: 'note_added',
          lead_id: lead.id,
          details: { note: newNote },
        },
        { $autoCancel: false }
      );

      onUpdate(updatedLead);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
        ) : (
          notes.map((note, index) => (
            <Card key={index} className="p-3 bg-muted/50">
              <p className="text-sm text-foreground mb-2">{note.text}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{note.user_name}</span>
                <span>{format(new Date(note.timestamp), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="min-h-[80px] text-foreground"
        />
        <Button
          onClick={handleAddNote}
          disabled={!newNote.trim() || loading}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Adding...' : 'Add note'}
        </Button>
      </div>
    </div>
  );
};

export default NotesPanel;
