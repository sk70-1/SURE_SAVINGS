"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Tag, Check, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { ScheduledObligation, CreateObligationPayload, UpdateObligationPayload } from "../../lib/types";

interface ObligationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateObligationPayload) => Promise<void>;
  onUpdate?: (id: number, data: UpdateObligationPayload) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialObligation?: ScheduledObligation | null;
  currency?: string;
}

export const ObligationModal: React.FC<ObligationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  onDelete,
  initialObligation,
  currency = "INR",
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("bills");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly" | "yearly" | "once">("monthly");
  const [dueDay, setDueDay] = useState("10");
  const [dueDate, setDueDate] = useState("");
  const [isEssential, setIsEssential] = useState(true);
  const [reminderDays, setReminderDays] = useState("3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialObligation) {
      setTitle(initialObligation.title);
      setAmount(initialObligation.amount.toString());
      setCategory(initialObligation.category || "bills");
      setFrequency(initialObligation.frequency || "monthly");
      setDueDay(initialObligation.due_day?.toString() || "10");
      setDueDate(initialObligation.next_due_date ? initialObligation.next_due_date.split("T")[0] : "");
      setIsEssential(initialObligation.is_essential ?? true);
      setReminderDays(initialObligation.reminder_days_before?.toString() || "3");
    } else {
      setTitle("");
      setAmount("");
      setCategory("bills");
      setFrequency("monthly");
      setDueDay("10");
      setDueDate("");
      setIsEssential(true);
      setReminderDays("3");
    }
    setError(null);
    setShowDeleteConfirm(false);
  }, [initialObligation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setError("Please provide a title for the obligation.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (initialObligation && onUpdate) {
        await onUpdate(initialObligation.id, {
          title: title.trim(),
          amount: numAmount,
          category,
          frequency,
          due_day: frequency === "monthly" ? parseInt(dueDay, 10) : undefined,
          next_due_date: dueDate ? `${dueDate}T09:00:00Z` : undefined,
          is_essential: isEssential,
          reminder_days_before: parseInt(reminderDays, 10) || 3,
        });
      } else {
        await onSubmit({
          title: title.trim(),
          amount: numAmount,
          category,
          frequency,
          due_day: frequency === "monthly" ? parseInt(dueDay, 10) : undefined,
          next_due_date: dueDate ? `${dueDate}T09:00:00Z` : undefined,
          is_essential: isEssential,
          reminder_days_before: parseInt(reminderDays, 10) || 3,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save obligation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialObligation || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(initialObligation.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete obligation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#eae8e3] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#eae8e3]">
          <div>
            <h3 className="text-base font-black text-[#111827]">
              {initialObligation ? "Edit Scheduled Bill" : "Add Scheduled Bill"}
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Keep track of recurring EMIs, rent, subscriptions, and mandates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#fff5f5] border border-[#fecdd3] text-xs text-[#e11d48] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Delete Confirmation Step */}
        {showDeleteConfirm ? (
          <div className="p-4 rounded-2xl bg-[#fff5f5] border border-[#fecdd3] space-y-3 text-center">
            <AlertCircle className="w-8 h-8 text-[#e11d48] mx-auto" />
            <h4 className="text-sm font-extrabold text-[#9f1239]">
              Confirm Deletion
            </h4>
            <p className="text-xs text-[#6b7280]">
              Are you sure you want to delete &quot;<strong>{title}</strong>&quot;? This will remove all future occurrences from your cash-flow calendar.
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-xs font-bold text-[#4b5563] bg-white border border-[#eae8e3] rounded-xl hover:bg-[#f3f4f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#e11d48] hover:bg-[#be123c] rounded-xl shadow-xs"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Bill / Mandate Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bike EV EMI Mandate, Rent, Cloud VPS"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#eae8e3] focus:border-[#ff5b45] focus:ring-1 focus:ring-[#ff5b45] outline-none transition-all"
              />
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Amount ({currency === "INR" ? "₹" : "$"}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 6500"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#eae8e3] focus:border-[#ff5b45] focus:ring-1 focus:ring-[#ff5b45] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#eae8e3] focus:border-[#ff5b45] focus:ring-1 focus:ring-[#ff5b45] outline-none bg-white transition-all"
                >
                  <option value="loan">Loan / EMI</option>
                  <option value="rent">Housing / Rent</option>
                  <option value="utilities">Utilities & Wifi</option>
                  <option value="transport">Transport / Fuel</option>
                  <option value="insurance">Insurance</option>
                  <option value="subscription">Software / Tool</option>
                  <option value="bills">General Bill</option>
                </select>
              </div>
            </div>

            {/* Frequency & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#eae8e3] focus:border-[#ff5b45] focus:ring-1 focus:ring-[#ff5b45] outline-none bg-white transition-all"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="once">Once (One-off)</option>
                </select>
              </div>

              {frequency === "monthly" ? (
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Day of Month (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#eae8e3] focus:border-[#ff5b45] focus:ring-1 focus:ring-[#ff5b45] outline-none transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#eae8e3] focus:border-[#ff5b45] focus:ring-1 focus:ring-[#ff5b45] outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Essential Mandate Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border border-[#eae8e3]">
              <div>
                <span className="text-xs font-bold text-[#111827] block">Essential Mandate</span>
                <span className="text-[10px] text-[#6b7280]">
                  Required for livelihood (EMI, rent, medicine, essential bills)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="w-4 h-4 text-[#ff5b45] rounded focus:ring-[#ff5b45] border-[#eae8e3] cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              {initialObligation && onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-[#9ca3af] hover:text-[#e11d48] hover:bg-[#ffe4e6] rounded-xl transition-colors"
                  title="Delete Obligation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : <div />}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#6b7280] hover:text-[#111827] bg-[#fbfbfa] hover:bg-[#f3f4f6] rounded-xl border border-[#eae8e3] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl shadow-md shadow-[#ff5b45]/20 transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{loading ? "Saving..." : initialObligation ? "Update Bill" : "Add Bill"}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
