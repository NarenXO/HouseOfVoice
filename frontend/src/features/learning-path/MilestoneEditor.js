import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function MilestoneEditor({ milestones, onUpdateMilestone, onAddMilestone, onDeleteMilestone, }) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const handleEdit = (milestone) => {
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
            });
            setEditingId(null);
            setEditForm({});
        }
    };
    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };
    return (_jsxs("div", { className: "w-full max-w-4xl mx-auto p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Edit Learning Path" }), _jsx("button", { onClick: onAddMilestone, className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors", children: "Add Milestone" })] }), _jsx("div", { className: "space-y-4", children: milestones.map((milestone) => (_jsx("div", { className: "bg-white rounded-lg shadow border border-gray-200 p-4", children: editingId === milestone.id ? (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: editForm.title || "", onChange: (e) => setEditForm({ ...editForm, title: e.target.value }), placeholder: "Milestone title", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("textarea", { value: editForm.goal || "", onChange: (e) => setEditForm({ ...editForm, goal: e.target.value }), placeholder: "Goal description", rows: 2, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleSave, className: "px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors", children: "Save" }), _jsx("button", { onClick: handleCancel, className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors", children: "Cancel" })] })] })) : (_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: milestone.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: milestone.goal }), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: ["Order: ", milestone.order_index] }), _jsx("span", { className: "text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600", children: milestone.status })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleEdit(milestone), className: "px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors", children: "Edit" }), _jsx("button", { onClick: () => onDeleteMilestone(milestone.id), className: "px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors", children: "Delete" })] })] })) }, milestone.id))) })] }));
}
