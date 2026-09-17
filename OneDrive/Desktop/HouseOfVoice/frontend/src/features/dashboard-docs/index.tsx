import { useState } from 'react';
import SessionNoteForm, { SavedNote } from './SessionNoteForm';
import AIDraftPanel from './AIDraftPanel';

export default function DashboardDocs() {
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  const handleNoteSaved = (note: SavedNote) => {
    setSavedNoteId(note.id);
  };

  return (
    <div>
      <SessionNoteForm onSubmit={handleNoteSaved} />
      <AIDraftPanel sessionNoteId={savedNoteId} />
    </div>
  );
}
