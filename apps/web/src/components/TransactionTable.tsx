"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, Search, Trash2, PlusCircle, ReceiptText } from "lucide-react";
import { Transaction } from "../lib/types";
import { formatDate, formatCurrency } from "../lib/formatters";

interface TransactionTableProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: number) => void;
  onOpenAddTransaction?: () => void;
  currencySymbol?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onDeleteTransaction,
  onOpenAddTransaction,
  currencySymbol = "₹",
}) => {
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [filter, setFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!onDeleteTransaction) return;
    setDeletingId(id);
    try {
      await onDeleteTransaction(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eae8e3] gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-wide text-[#111827] uppercase">
            {t("title")}
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            {t("subtitle")} ({transactions.length})
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Quick Add Button */}
          {onOpenAddTransaction && (
            <button
              onClick={onOpenAddTransaction}
              className="px-3 py-1.5 text-xs font-bold text-[#ff5b45] bg-[#fff5f3] hover:bg-[#ffe8e4] border border-[#ffdad4] rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{tCommon("add")}</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={`${tCommon("search")}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-48 bg-[#fbfbfa] text-xs text-[#111827] pl-8 pr-3 py-1.5 rounded-xl border border-[#eae8e3] focus:outline-none focus:ring-1 focus:ring-[#ff5b45]"
            />
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f3f4f6] text-[#9ca3af] flex items-center justify-center mb-3">
            <ReceiptText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#111827] mb-1">{t("empty")}</h4>
          <p className="text-xs text-[#6b7280] max-w-sm mb-4">
            {t("emptyDesc")}
          </p>
          {onOpenAddTransaction && (
            <button
              onClick={onOpenAddTransaction}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5b45] to-[#f05138] rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("recordFirst")}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#6b7280] border-b border-[#eae8e3]">
                <th className="pb-3 font-semibold">{t("tableDate")}</th>
                <th className="pb-3 font-semibold">{t("tableDescription")}</th>
                <th className="pb-3 font-semibold">{t("tableCategory")}</th>
                <th className="pb-3 font-semibold text-center">{t("tableType")}</th>
                <th className="pb-3 font-semibold text-right">{t("tableAmount")}</th>
                {onDeleteTransaction && <th className="pb-3 font-semibold text-center w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filtered.slice(0, 15).map((tx) => {
                const isIncome = tx.transaction_type === "INCOME";
                const dateStr = formatDate(tx.date, locale);

                return (
                  <tr key={tx.id} className="hover:bg-[#f9fafb] transition-colors group">
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
                        <span>{isIncome ? tCommon("income") : tCommon("expense")}</span>
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right font-bold whitespace-nowrap font-mono ${
                        isIncome ? "text-[#059669]" : "text-[#111827]"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(tx.amount, "INR", locale)}
                    </td>
                    {onDeleteTransaction && (
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#9ca3af] hover:text-[#e11d48] rounded-lg transition-all cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
