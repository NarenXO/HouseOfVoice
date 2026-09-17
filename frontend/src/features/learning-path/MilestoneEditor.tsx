import { useState } from "react";
import { Milestone } from "./types";

interface MilestoneEditorProps {
  milestones: Milestone[];
  onUpdateMilestone: (milestone: Milestone) => void;
  onAddMilestone: () => void;
  onDeleteMilestone: (milestoneId: string) => void;
}

export default function MilestoneEditor({
  milestones,
  onUpdateMilestone,
  onAddMilestone,
  onDeleteMilestone,
}: MilestoneEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Milestone>>({});

  const handleEdit = (milestone: Milestone) => {
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
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Learning Path</h2>
        <button
          onClick={onAddMilestone}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add Milestone
        </button>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-4"
          >
            {editingId === milestone.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Milestone title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={editForm.goal || ""}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  placeholder="Goal description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{milestone.goal}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Order: {milestone.order_index}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {milestone.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(milestone)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteMilestone(milestone.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
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
