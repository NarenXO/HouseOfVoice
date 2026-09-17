import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function MilestoneEditor({ milestones, onUpdateMilestone, onAddMilestone, onDeleteMilestone, disabled = false, }) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const handleEdit = (milestone) => {
        if (disabled)
            return;
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
    return (_jsxs("div", { className: "w-full max-w-4xl mx-auto p-6 pb-24", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-black text-[#022C22] tracking-tight", children: "Clinician Mode - Edit Learning Path" }), _jsx("button", { onClick: onAddMilestone, disabled: disabled, className: "bg-[#059669] hover:bg-[#047857] text-white font-extrabold rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm", children: "Add Milestone" })] }), disabled && (_jsx("div", { className: "bg-[#064E3B] border border-[#0D9488] rounded-[12px] p-4 mb-6 shadow-sm", children: _jsx("p", { className: "text-[#CCFBF1] font-extrabold text-sm", children: "Path is approved and locked. Editing is disabled." }) })), _jsx("div", { className: "space-y-4", children: milestones.map((milestone) => (_jsx("div", { className: `bg-white border-2 border-[#059669] rounded-[16px] p-5 shadow-sm ${disabled ? 'opacity-60' : ''}`, children: editingId === milestone.id ? (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: editForm.title || "", onChange: (e) => setEditForm({ ...editForm, title: e.target.value }), placeholder: "Milestone title", className: "w-full bg-white border border-[#059669] text-[#022C22] font-bold focus:border-[#047857] focus:ring-1 focus:ring-[#047857] rounded-lg px-3 py-2" }), _jsx("textarea", { value: editForm.goal || "", onChange: (e) => setEditForm({ ...editForm, goal: e.target.value }), placeholder: "Goal description", rows: 2, className: "w-full bg-white border border-[#059669] text-[#022C22] font-bold focus:border-[#047857] focus:ring-1 focus:ring-[#047857] rounded-lg px-3 py-2" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleSave, className: "bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold rounded-lg px-4 py-2 transition-colors shadow-sm", children: "Save" }), _jsx("button", { onClick: handleCancel, className: "bg-white text-[#022C22] border border-[#059669] font-extrabold rounded-lg px-4 py-2 hover:bg-[#F0FDF4] transition-colors", children: "Cancel" })] })] })) : (_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-black text-[#022C22] text-base", children: milestone.title }), _jsx("p", { className: "text-sm font-bold text-[#1E293B] mt-1", children: milestone.goal }), _jsxs("div", { className: "flex items-center gap-2 mt-3", children: [_jsxs("span", { className: "text-xs font-bold text-[#1E293B]", children: ["Order: ", milestone.order_index] }), _jsx("span", { className: "bg-[#D1FAE5] text-[#047857] border border-[#059669] rounded-full px-3 py-0.5 text-xs font-black capitalize", children: milestone.status })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleEdit(milestone), disabled: disabled, className: "px-3 py-1.5 text-xs bg-[#D1FAE5] text-[#047857] border border-[#059669] rounded-lg hover:bg-[#A7F3D0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-black", children: "Edit" }), _jsx("button", { onClick: () => onDeleteMilestone(milestone.id), disabled: disabled, className: "px-3 py-1.5 text-xs bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] rounded-lg hover:bg-[#FECACA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-black", children: "Delete" })] })] })) }, milestone.id))) })] }));
}
