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
          className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#2E5A88] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Milestone
        </button>
      </div>

      {disabled && (
        <div className="bg-[#CCFBF1] border border-[#0D9488] rounded-lg p-4 mb-6">
          <p className="text-[#0F172A] font-medium">
            Path is approved and locked. Editing is disabled.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`bg-white border p-4 ${disabled ? 'border-[#E2E8F0] opacity-60' : 'border-[#E2E8F0]'}`}
          >
            {editingId === milestone.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Milestone title"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
                <textarea
                  value={editForm.goal || ""}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  placeholder="Goal description"
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F4F6F8] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#0F172A]">{milestone.title}</h3>
                  <p className="text-sm text-[#64748B] mt-1">{milestone.goal}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#64748B]">Order: {milestone.order_index}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#F4F6F8] text-[#64748B]">
                      {milestone.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(milestone)}
                    disabled={disabled}
                    className="px-3 py-1 text-sm bg-[#CCFBF1] text-[#0D9488] rounded hover:bg-[#B7EBD6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteMilestone(milestone.id)}
                    disabled={disabled}
                    className="px-3 py-1 text-sm bg-[#FEE2E2] text-[#DC2626] rounded hover:bg-[#FECACA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
