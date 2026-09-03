"use client";

import React, { useState } from "react";
import { X, PlusCircle, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, Tag } from "lucide-react";
import { api } from "../lib/api";
import { CreateTransactionPayload } from "../lib/types";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  currencySymbol?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onTransactionAdded,
  currencySymbol = "₹",
}) => {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("freelance");
  const [isEssential, setIsEssential] = useState<boolean>(false);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categoriesIncome = [
    { id: "freelance", label: "Freelance / Gig" },
    { id: "client_payout", label: "Client Payment" },
    { id: "bonus", label: "Bonus / Tip" },
    { id: "other", label: "Other Income" },
  ];

  const categoriesExpense = [
    { id: "housing", label: "Rent & Housing" },
    { id: "food", label: "Groceries & Food" },
    { id: "utilities", label: "Utilities & Bills" },
    { id: "equipment", label: "Tools & Equipment" },
    { id: "transport", label: "Transit / Fuel" },
    { id: "leisure", label: "Discretionary" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a short description.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateTransactionPayload = {
        date: new Date(date).toISOString(),
        amount: numericAmount,
        description: description.trim(),
        category,
        transaction_type: type,
        is_essential: type === "EXPENSE" ? isEssential : false,
        source: "manual",
      };

      await api.createTransaction(payload);
      onTransactionAdded();
      onClose();
      // Reset form
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Failed to record transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9ca3af] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#f3f4f6] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] flex items-center justify-center text-white shadow-md shadow-[#ff5b45]/25 shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Record Transaction</h3>
            <p className="text-xs text-[#6b7280]">
              Log income or expenses to keep your smart buffer accurate
            </p>
          </div>
        </div>

        {/* Type Toggle: Income vs Expense */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f3f4f6] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setType("INCOME");
              setCategory("freelance");
              setIsEssential(false);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              type === "INCOME"
                ? "bg-white text-[#059669] shadow-sm border border-[#a7f3d0]"
                : "text-[#6b7280] hover:text-[#111827]"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Income Received</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType("EXPENSE");
              setCategory("food");
            }}
            className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              type === "EXPENSE"
                ? "bg-white text-[#e11d48] shadow-sm border border-[#fecdd3]"
                : "text-[#6b7280] hover:text-[#111827]"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Expense Paid</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Amount ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#9ca3af]">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-base bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] font-mono font-bold"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Description / Memo
            </label>
            <input
              type="text"
              required
              placeholder={type === "INCOME" ? "Client project milestone payment" : "Monthly apartment rent"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45]"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45] font-medium"
              >
                {(type === "INCOME" ? categoriesIncome : categoriesExpense).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#fbfbfa] border border-[#eae8e3] rounded-xl focus:outline-none focus:border-[#ff5b45]"
              />
            </div>
          </div>

          {/* Is Essential Checkbox (For Expenses) */}
          {type === "EXPENSE" && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isEssential"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="w-4 h-4 text-[#ff5b45] rounded border-[#eae8e3] focus:ring-[#ff5b45]"
              />
              <label htmlFor="isEssential" className="text-xs text-[#4b5563] cursor-pointer">
                <strong>Essential Expense</strong> (Required for basic living / non-negotiable)
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 rounded-xl shadow-lg shadow-[#ff5b45]/25 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <span>Saving...</span> : <span>Confirm & Record Transaction</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
