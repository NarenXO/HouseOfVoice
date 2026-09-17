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
        <h2 className="text-2xl font-bold text-[#0F172A]">Clinician Mode - Edit Learning Path</h2>
        <button
          onClick={onAddMilestone}
          disabled={disabled}
          className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Add Milestone
        </button>
      </div>

      {disabled && (
        <div className="bg-[#CCFBF1] border border-[#0D9488] rounded-lg p-4 mb-6">
          <p className="text-[#0F172A] font-semibold">
            Path is approved and locked. Editing is disabled.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`bg-white border p-4 ${disabled ? 'border-[#CBD5E1] opacity-60' : 'border-[#CBD5E1]'}`}
          >
            {editingId === milestone.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Milestone title"
                  className="w-full px-3 py-2 border border-[#CBD5E1] text-[#0F172A] font-medium focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] rounded-[8px]"
                />
                <textarea
                  value={editForm.goal || ""}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  placeholder="Goal description"
                  rows={2}
                  className="w-full px-3 py-2 border border-[#CBD5E1] text-[#0F172A] font-medium focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] rounded-[8px]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg font-semibold transition-colors shadow-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-white text-[#0F172A] border border-[#CBD5E1] rounded-lg font-semibold hover:bg-[#F4F6F8] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#0F172A]">{milestone.title}</h3>
                  <p className="text-base text-[#475569] mt-1">{milestone.goal}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-[#475569]">Order: {milestone.order_index}</span>
                    <span className="text-sm px-2 py-1 rounded-full bg-[#F1F5F9] text-[#0F172A] font-medium">
                      {milestone.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(milestone)}
                    disabled={disabled}
                    className="px-3 py-1 text-sm bg-[#CCFBF1] text-[#0D9488] rounded hover:bg-[#B7EBD6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteMilestone(milestone.id)}
                    disabled={disabled}
                    className="px-3 py-1 text-sm bg-[#FEE2E2] text-[#DC2626] rounded hover:bg-[#FECACA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
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
