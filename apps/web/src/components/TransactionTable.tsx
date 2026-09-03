"use client";

import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { Transaction } from "../lib/types";

interface TransactionTableProps {
  transactions: Transaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [filter, setFilter] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eae8e3] gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-wide text-[#111827] uppercase">
            Spending & Income History
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Your recent earnings and daily expenses
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search history..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-56 bg-[#fbfbfa] text-xs text-[#111827] pl-8 pr-3 py-1.5 rounded-xl border border-[#eae8e3] focus:outline-none focus:ring-1 focus:ring-[#ff5b45]"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[#6b7280] border-b border-[#eae8e3]">
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Description</th>
              <th className="pb-3 font-semibold">Category</th>
              <th className="pb-3 font-semibold text-center">In / Out</th>
              <th className="pb-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {filtered.slice(0, 15).map((tx) => {
              const isIncome = tx.transaction_type === "INCOME";
              const dateStr = new Date(tx.date).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <tr key={tx.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="py-3 text-[#6b7280] whitespace-nowrap font-mono text-[11px]">{dateStr}</td>
                  <td className="py-3 font-semibold text-[#111827]">
                    <div className="flex items-center space-x-1.5">
                      <span>{tx.description}</span>
                      {tx.is_essential && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] rounded">
                          Essential
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-[#f3f4f6] text-[#4b5563] text-[10px] uppercase font-bold tracking-wider">
                      {tx.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isIncome
                          ? "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]"
                          : "bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]"
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                      <span>{isIncome ? "Income" : "Expense"}</span>
                    </span>
                  </td>
                  <td
                    className={`py-3 text-right font-bold whitespace-nowrap font-mono ${
                      isIncome ? "text-[#059669]" : "text-[#111827]"
                    }`}
                  >
                    {isIncome ? "+" : "-"}₹
                    {tx.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
