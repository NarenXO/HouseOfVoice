import { useState } from "react";
import { Milestone } from "./types";

interface MilestoneEditorProps {
  milestones: Milestone[];
  onUpdateMilestone: (milestone: Milestone) => void;
  onAddMilestone: () => void;
  onDeleteMilestone: (milestoneId: string) => void;
  disabled?: boolean;
}

export default function MilestoneEditor({
  milestones,
  onUpdateMilestone,
  onAddMilestone,
  onDeleteMilestone,
  disabled = false,
}: MilestoneEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Milestone>>({});

  const handleEdit = (milestone: Milestone) => {
    if (disabled) return;
    setEditingId(milestone.id);
    setEditForm(milestone);
  };

  const handleSave = () => {
    if (editingId && editForm.title && editForm.goal) {
      onUpdateMilestone({
        ...editForm,
        id: editingId,
        path_id: editForm.path_id || "",
        order_index: editForm.order_index || 0,
        status: editForm.status || "locked",
        linked_demo_id: editForm.linked_demo_id || null,
      } as Milestone);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-[#022C22] tracking-tight">Clinician Mode - Edit Learning Path</h2>
        <button
          onClick={onAddMilestone}
          disabled={disabled}
          className="bg-[#064E3B] hover:bg-[#047857] text-white border border-[#0D9488] font-black rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Add Milestone
        </button>
      </div>

      {disabled && (
        <div className="bg-[#022C22] border border-[#059669] rounded-[12px] p-4 mb-6 shadow-sm">
          <p className="text-[#34D399] font-extrabold text-sm">
            Path is approved and locked. Editing is disabled.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`bg-[#064E3B] border-2 border-[#0D9488] rounded-[16px] p-5 shadow-md ${disabled ? 'opacity-60' : ''}`}
          >
            {editingId === milestone.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Milestone title"
                  className="w-full bg-[#022C22] border border-[#059669] text-white font-bold focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] rounded-lg px-3 py-2"
                />
                <textarea
                  value={editForm.goal || ""}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  placeholder="Goal description"
                  rows={2}
                  className="w-full bg-[#022C22] border border-[#059669] text-white font-bold focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] rounded-lg px-3 py-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-white hover:bg-[#CCFBF1] text-[#064E3B] font-black rounded-lg px-4 py-2 transition-colors shadow-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-[#022C22] text-[#D1FAE5] border border-[#059669] font-extrabold rounded-lg px-4 py-2 hover:bg-[#064E3B] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-white text-base">{milestone.title}</h3>
                  <p className="text-sm font-bold text-[#D1FAE5] mt-1">{milestone.goal}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-bold text-[#D1FAE5]">Order: {milestone.order_index}</span>
                    <span className="bg-[#022C22] text-[#34D399] border border-[#059669] rounded-full px-3 py-0.5 text-xs font-black capitalize">
                      {milestone.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(milestone)}
                    disabled={disabled}
                    className="px-3 py-1.5 text-xs bg-white text-[#064E3B] font-black rounded-lg hover:bg-[#CCFBF1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteMilestone(milestone.id)}
                    disabled={disabled}
                    className="px-3 py-1.5 text-xs bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] rounded-lg hover:bg-[#FEE2E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-black shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
