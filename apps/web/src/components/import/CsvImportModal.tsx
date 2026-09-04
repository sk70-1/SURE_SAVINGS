"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  X, UploadCloud, FileText, AlertTriangle, ArrowRight,
  CheckCircle2, Download, RefreshCw
} from "lucide-react";
import { api } from "../../lib/api";
import { CsvPreviewItem, CsvPreviewResponse, CategoryMetadata } from "../../lib/types";
import { formatCurrency } from "../../lib/formatters";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => Promise<void>;
  currency?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  currency = "INR",
}) => {
  const t = useTranslations("csvImport");
  const locale = useLocale();

  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "SUCCESS">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<CsvPreviewResponse | null>(null);
  const [items, setItems] = useState<CsvPreviewItem[]>([]);
  const [categories, setCategories] = useState<CategoryMetadata[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE" | "DUPLICATES">("ALL");

  const [importedSummary, setImportedSummary] = useState<{
    count: number;
    inflow: number;
    outflow: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatMoney = (val: number) => {
    return formatCurrency(val, currency, locale);
  };

  // Load available category metadata
  useEffect(() => {
    if (isOpen) {
      api.getCategories().then(setCategories).catch(() => {});
    }
  }, [isOpen]);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep("UPLOAD");
      setFile(null);
      setError(null);
      setPreviewData(null);
      setItems([]);
      setImportedSummary(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid .csv file.");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const preview = await api.previewCsv(selectedFile);
      setPreviewData(preview);
      setItems(preview.items);
      setStep("PREVIEW");
    } catch (err: any) {
      setError(err.message || "Failed to process CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = (select: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.is_duplicate && select ? { ...it, selected: false } : { ...it, selected: select }))
    );
  };

  const handleToggleItem = (rowIndex: number) => {
    setItems((prev) =>
      prev.map((it) => (it.row_index === rowIndex ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleCategoryChange = (rowIndex: number, newCat: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.row_index === rowIndex) {
          const matchedCat = categories.find((c) => c.id === newCat);
          return {
            ...it,
            category: newCat,
            is_essential: matchedCat ? matchedCat.is_essential : it.is_essential,
          };
        }
        return it;
      })
    );
  };

  const handleToggleEssential = (rowIndex: number) => {
    setItems((prev) =>
      prev.map((it) => (it.row_index === rowIndex ? { ...it, is_essential: !it.is_essential } : it))
    );
  };

  const handleConfirmImport = async () => {
    const selectedItems = items.filter((it) => it.selected);
    if (selectedItems.length === 0) {
      setError("Please select at least one transaction to import.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const commitItems = selectedItems.map((it) => ({
        date: it.date,
        description: it.clean_description || it.description,
        amount: it.amount,
        transaction_type: it.transaction_type,
        category: it.category,
        is_essential: it.is_essential,
        source: "csv_import",
      }));

      const res = await api.confirmCsv(commitItems);
      setImportedSummary({
        count: res.imported_count,
        inflow: res.total_inflow,
        outflow: res.total_outflow,
      });
      setStep("SUCCESS");
      await onImportComplete();
    } catch (err: any) {
      setError(err.message || "Failed to commit transactions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleCsv = `Date,Narration,Withdrawal,Deposit
2026-09-02,UPI/CR/9921/BLINKIT COMMERCE/PAYOUT,,8400.00
2026-09-04,ACH/BAJAJ FINANCE/BIKE LOAN EMI,6500.00,
2026-09-06,POS DMART GROCERIES BANGALORE,3200.00,
2026-09-08,NEFT-UPWORK GLOBAL INC-INVOICE992,,14500.00
2026-09-10,UPI/DR/AIRTEL FIBERNET/WIFI,1599.00,
2026-09-12,UPI/DR/SHELL PETROL PUMP/FUEL,1200.00,
2026-09-14,POS STARBUCKS COFFEE,450.00,
2026-09-16,ACH/STUDIO COWORKING RENT SHARE,2800.00,`;

    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sure_savings_sample_statement.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = items.filter((it) => {
    if (filterType === "INCOME") return it.transaction_type === "INCOME";
    if (filterType === "EXPENSE") return it.transaction_type === "EXPENSE";
    if (filterType === "DUPLICATES") return it.is_duplicate;
    return true;
  });

  const selectedCount = items.filter((it) => it.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#eae8e3] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eae8e3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10b981] text-white flex items-center justify-center shadow-md shadow-[#059669]/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111827]">
                {t("modalTitle")}
              </h3>
              <p className="text-xs text-[#6b7280]">
                {t("modalSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#fff5f5] border border-[#fecdd3] text-xs text-[#e11d48] flex items-center space-x-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Steps */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: UPLOAD */}
          {step === "UPLOAD" && (
            <div className="space-y-6">
              
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-[#ff5b45] bg-[#fff5f3]"
                    : "border-[#d1d5db] hover:border-[#ff5b45] bg-[#fafaf9] hover:bg-[#fffbfb]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-white text-[#ff5b45] flex items-center justify-center mx-auto shadow-sm border border-[#eae8e3] mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-extrabold text-[#111827]">
                  {loading ? t("dropzoneLoading") : t("dropzoneTitle")}
                </h4>
                <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
                  {t("dropzoneDesc")}
                </p>
                {loading && (
                  <div className="mt-4 inline-flex items-center space-x-2 text-xs font-bold text-[#ff5b45]">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("analyzingNotice")}</span>
                  </div>
                )}
              </div>

              {/* Supported Platforms Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]">
                  {t("supportedFormats")}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold text-[#4b5563]">
                  <div className="p-2.5 rounded-xl bg-[#fbfbfa] border border-[#eae8e3] flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span>{t("formatBank")}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#fbfbfa] border border-[#eae8e3] flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
                    <span>{t("formatUpi")}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#fbfbfa] border border-[#eae8e3] flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                    <span>{t("formatGig")}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#fbfbfa] border border-[#eae8e3] flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                    <span>{t("formatFreelance")}</span>
                  </div>
                </div>
              </div>

              {/* Sample Template Link */}
              <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#eae8e3] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#111827]">{t("sampleTitle")}</div>
                  <div className="text-[11px] text-[#6b7280]">
                    {t("sampleDesc")}
                  </div>
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 text-xs font-bold text-[#ff5b45] hover:text-[#e04835] bg-white border border-[#ffdad4] hover:bg-[#fff5f3] rounded-xl flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("downloadSample")}</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: PREVIEW & REVIEW */}
          {step === "PREVIEW" && previewData && (
            <div className="space-y-4">
              
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#fafaf9] border border-[#eae8e3]">
                  <div className="text-[10px] font-extrabold uppercase text-[#6b7280]">{t("totalParsed")}</div>
                  <div className="text-lg font-black text-[#111827] mt-0.5">{previewData.total_rows}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0]">
                  <div className="text-[10px] font-extrabold uppercase text-[#059669]">{t("inflowsDetected")}</div>
                  <div className="text-lg font-black text-[#059669] mt-0.5">+{formatMoney(previewData.total_inflow)}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
                  <div className="text-[10px] font-extrabold uppercase text-[#ea580c]">{t("outflowsDetected")}</div>
                  <div className="text-lg font-black text-[#ea580c] mt-0.5">-{formatMoney(previewData.total_outflow)}</div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  previewData.duplicate_rows > 0 ? "bg-[#fff5f5] border-[#fecdd3]" : "bg-[#fafaf9] border-[#eae8e3]"
                }`}>
                  <div className="text-[10px] font-extrabold uppercase text-[#6b7280]">{t("duplicatesFlagged")}</div>
                  <div className={`text-lg font-black mt-0.5 ${
                    previewData.duplicate_rows > 0 ? "text-[#e11d48]" : "text-[#111827]"
                  }`}>
                    {previewData.duplicate_rows}
                  </div>
                </div>
              </div>

              {/* Filters & Selection Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => handleToggleSelectAll(true)}
                    className="font-bold text-[#ff5b45] hover:underline cursor-pointer"
                  >
                    {t("selectAll")}
                  </button>
                  <span className="text-[#d1d5db]">|</span>
                  <button
                    onClick={() => handleToggleSelectAll(false)}
                    className="font-medium text-[#6b7280] hover:text-[#111827] cursor-pointer"
                  >
                    {t("deselectAll")}
                  </button>
                  {previewData.duplicate_rows > 0 && (
                    <>
                      <span className="text-[#d1d5db]">|</span>
                      <span className="text-[11px] text-[#e11d48] font-semibold">
                        {t("duplicatesUnchecked")}
                      </span>
                    </>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1 text-xs font-semibold">
                  <button
                    onClick={() => setFilterType("ALL")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === "ALL" ? "bg-[#111827] text-white" : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {t("filterAll")} ({items.length})
                  </button>
                  <button
                    onClick={() => setFilterType("INCOME")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === "INCOME" ? "bg-[#059669] text-white" : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {t("filterInflows")}
                  </button>
                  <button
                    onClick={() => setFilterType("EXPENSE")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === "EXPENSE" ? "bg-[#ea580c] text-white" : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {t("filterOutflows")}
                  </button>
                  {previewData.duplicate_rows > 0 && (
                    <button
                      onClick={() => setFilterType("DUPLICATES")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        filterType === "DUPLICATES" ? "bg-[#e11d48] text-white" : "bg-[#f3f4f6] text-[#6b7280]"
                      }`}
                    >
                      {t("filterDuplicates")} ({previewData.duplicate_rows})
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions Preview Table */}
              <div className="border border-[#eae8e3] rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#fafaf9] border-b border-[#eae8e3] sticky top-0 z-10 text-[10px] font-extrabold uppercase text-[#6b7280]">
                      <tr>
                        <th className="p-3 w-10 text-center">{t("colImport")}</th>
                        <th className="p-3 w-28">{t("colDate")}</th>
                        <th className="p-3">{t("colNarration")}</th>
                        <th className="p-3 w-28 text-right">{t("colAmount")}</th>
                        <th className="p-3 w-40">{t("colCategory")}</th>
                        <th className="p-3 w-20 text-center">{t("colEssential")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {filteredItems.map((it) => (
                        <tr
                          key={it.row_index}
                          className={`transition-colors ${
                            it.is_duplicate
                              ? "bg-[#fffafa] opacity-80"
                              : it.selected
                              ? "bg-white hover:bg-[#fbfbfa]"
                              : "bg-[#f9fafb] text-[#9ca3af]"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={it.selected}
                              onChange={() => handleToggleItem(it.row_index)}
                              className="w-4 h-4 text-[#ff5b45] rounded border-[#d1d5db] focus:ring-[#ff5b45] cursor-pointer"
                            />
                          </td>

                          {/* Date */}
                          <td className="p-3 font-semibold text-[#111827] whitespace-nowrap">
                            {it.date}
                          </td>

                          {/* Description with Clean Badge */}
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-[#111827] truncate max-w-[240px]">
                                {it.clean_description}
                              </span>
                              {it.is_duplicate && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#ffe4e6] text-[#e11d48] shrink-0">
                                  {t("duplicateBadge")}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#9ca3af] truncate max-w-[280px]" title={it.description}>
                              {it.description}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="p-3 text-right font-black whitespace-nowrap">
                            <span className={it.transaction_type === "INCOME" ? "text-[#059669]" : "text-[#ea580c]"}>
                              {it.transaction_type === "INCOME" ? "+" : "-"}
                              {formatMoney(it.amount)}
                            </span>
                          </td>

                          {/* Category Override Select */}
                          <td className="p-3">
                            <select
                              value={it.category}
                              onChange={(e) => handleCategoryChange(it.row_index, e.target.value)}
                              className="w-full text-xs font-semibold py-1 px-2 rounded-lg border border-[#eae8e3] bg-white focus:border-[#ff5b45] outline-none"
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Essential Toggle */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={it.is_essential}
                              disabled={it.transaction_type === "INCOME"}
                              onChange={() => handleToggleEssential(it.row_index)}
                              className="w-3.5 h-3.5 text-[#ea580c] rounded border-[#d1d5db] focus:ring-[#ea580c] cursor-pointer disabled:opacity-20"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "SUCCESS" && importedSummary && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-[#111827]">
                {t("successTitle")}
              </h4>
              <p className="text-xs text-[#6b7280] max-w-sm mx-auto leading-relaxed">
                {t("successDesc", { count: importedSummary.count })}
              </p>

              <div className="flex items-center justify-center space-x-6 text-xs pt-2">
                <div>
                  <span className="text-[#6b7280] block text-[10px] uppercase font-bold">{t("totalInflows")}</span>
                  <span className="font-black text-[#059669] text-base">+{formatMoney(importedSummary.inflow)}</span>
                </div>
                <div className="w-px h-8 bg-[#eae8e3]" />
                <div>
                  <span className="text-[#6b7280] block text-[10px] uppercase font-bold">{t("totalOutflows")}</span>
                  <span className="font-black text-[#ea580c] text-base">-{formatMoney(importedSummary.outflow)}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#ff5b45]/20 cursor-pointer"
                >
                  {t("done")}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step === "PREVIEW" && (
          <div className="px-6 py-4 border-t border-[#eae8e3] bg-[#fafaf9] flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                setStep("UPLOAD");
                setFile(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-[#6b7280] hover:text-[#111827] bg-white border border-[#eae8e3] rounded-xl hover:bg-[#f3f4f6] transition-colors cursor-pointer"
            >
              {t("uploadDifferentFile")}
            </button>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-[#6b7280]">
                {t("selectedCount", { count: selectedCount })}
              </span>
              <button
                onClick={handleConfirmImport}
                disabled={loading || selectedCount === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-[#ff5b45] to-[#f05138] hover:opacity-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-[#ff5b45]/20 flex items-center space-x-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("importing")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("confirmImport", { count: selectedCount })}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
