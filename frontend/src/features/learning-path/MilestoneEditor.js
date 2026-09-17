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
    return (_jsxs("div", { className: "w-full max-w-4xl mx-auto p-6 pb-24", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-[#0F172A]", children: "Clinician Mode - Edit Learning Path" }), _jsx("button", { onClick: onAddMilestone, disabled: disabled, className: "bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm", children: "Add Milestone" })] }), disabled && (_jsx("div", { className: "bg-[#CCFBF1] border border-[#0D9488] rounded-[14px] p-4 mb-6 shadow-sm", children: _jsx("p", { className: "text-[#0F172A] font-semibold text-sm", children: "Path is approved and locked. Editing is disabled." }) })), _jsx("div", { className: "space-y-4", children: milestones.map((milestone) => (_jsx("div", { className: `bg-white border border-[#A7E3D5] rounded-[14px] p-5 shadow-sm ${disabled ? 'opacity-60' : ''}`, children: editingId === milestone.id ? (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: editForm.title || "", onChange: (e) => setEditForm({ ...editForm, title: e.target.value }), placeholder: "Milestone title", className: "w-full bg-white border border-[#A7E3D5] text-[#0F172A] font-medium focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] rounded-lg px-3 py-2" }), _jsx("textarea", { value: editForm.goal || "", onChange: (e) => setEditForm({ ...editForm, goal: e.target.value }), placeholder: "Goal description", rows: 2, className: "w-full bg-white border border-[#A7E3D5] text-[#0F172A] font-medium focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] rounded-lg px-3 py-2" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleSave, className: "bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded-lg px-4 py-2 transition-colors shadow-sm", children: "Save" }), _jsx("button", { onClick: handleCancel, className: "bg-white text-[#0F172A] border border-[#A7E3D5] font-semibold rounded-lg px-4 py-2 hover:bg-[#F8FAFC] transition-colors", children: "Cancel" })] })] })) : (_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-[#0F172A] text-base", children: milestone.title }), _jsx("p", { className: "text-sm font-medium text-[#334155] mt-1", children: milestone.goal }), _jsxs("div", { className: "flex items-center gap-2 mt-3", children: [_jsxs("span", { className: "text-xs font-semibold text-[#334155]", children: ["Order: ", milestone.order_index] }), _jsx("span", { className: "bg-[#CCFBF1] text-[#0F766E] border border-[#0D9488] rounded-full px-2.5 py-0.5 text-xs font-bold capitalize", children: milestone.status })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleEdit(milestone), disabled: disabled, className: "px-3 py-1.5 text-xs bg-[#CCFBF1] text-[#0F766E] border border-[#0D9488] rounded-lg hover:bg-[#B7EBD6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold", children: "Edit" }), _jsx("button", { onClick: () => onDeleteMilestone(milestone.id), disabled: disabled, className: "px-3 py-1.5 text-xs bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] rounded-lg hover:bg-[#FECACA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold", children: "Delete" })] })] })) }, milestone.id))) })] }));
}
