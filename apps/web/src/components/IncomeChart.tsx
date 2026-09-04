"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Transaction, IncomeForecast, IncomeAnalytics } from "../lib/types";
import { formatCurrency } from "../lib/formatters";

interface IncomeChartProps {
  transactions: Transaction[];
  forecast: IncomeForecast | null;
  analytics: IncomeAnalytics | null;
}

export const IncomeChart: React.FC<IncomeChartProps> = ({
  transactions,
  forecast,
  analytics,
}) => {
  const t = useTranslations("incomeChart");
  const locale = useLocale();

  // Aggregate historical income by week
  const incomeTxs = transactions
    .filter((t) => t.transaction_type === "INCOME")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Build chart dataset
  const chartData: any[] = [];

  // Group into weekly points (take up to 8 historical weeks)
  const recentHistory = incomeTxs.slice(-8);
  recentHistory.forEach((tx, idx) => {
    const d = new Date(tx.date);
    chartData.push({
      label: `W${idx + 1} (${d.toLocaleDateString(locale === "bn" ? "bn-IN" : locale === "ta" ? "ta-IN" : locale === "hi" ? "hi-IN" : "en-IN", { month: "short", day: "numeric" })})`,
      actual: tx.amount,
      baseline: analytics?.stabilized_income || 0,
      type: "historical",
    });
  });

  // Append 4 future forecast weeks
  if (forecast && forecast.forecast_points) {
    forecast.forecast_points.forEach((pt, idx) => {
      chartData.push({
        label: `+${idx + 1}w`,
        projected: pt.predicted,
        confidenceLower: pt.lower,
        confidenceUpper: pt.upper,
        baseline: analytics?.stabilized_income || 0,
        type: "forecast",
      });
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl text-xs space-y-1 border border-[#eae8e3] shadow-lg">
          <p className="font-bold text-[#111827]">{label}</p>
          {data.actual !== undefined && (
            <p className="text-[#ff5b45] font-semibold">
              {t("madeThisWeek")} <strong className="text-[#111827] font-mono">{formatCurrency(data.actual, "INR", locale)}</strong>
            </p>
          )}
          {data.projected !== undefined && (
            <p className="text-[#0284c7] font-semibold">
              {t("expectedPay")} <strong className="text-[#111827] font-mono">{formatCurrency(data.projected, "INR", locale)}</strong>
            </p>
          )}
          {data.confidenceLower !== undefined && (
            <p className="text-[#6b7280] text-[11px] font-mono">
              {t("expectedRange")} {formatCurrency(data.confidenceLower, "INR", locale)} - {formatCurrency(data.confidenceUpper, "INR", locale)}
            </p>
          )}
          <p className="text-[#d97706] text-[11px] font-mono">
            {t("normalPayTooltip")} {formatCurrency(data.baseline || 0, "INR", locale)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#eae8e3] gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-wide text-[#111827] uppercase">
            {t("title")}
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#ff5b45]"></span>
            <span className="text-[#4b5563] text-[11px] font-medium">{t("whatYouMade")}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#0284c7]"></span>
            <span className="text-[#4b5563] text-[11px] font-medium">{t("nextWeeks")}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#f59e0b]"></span>
            <span className="text-[#4b5563] text-[11px] font-medium">{t("normalPay")}</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Stabilized Income Baseline */}
            {analytics && (
              <ReferenceLine
                y={analytics.stabilized_income}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `${t("normalPrefix")} ${formatCurrency(analytics.stabilized_income, "INR", locale)}`,
                  fill: "#d97706",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}

            {/* Historical Income Bars */}
            <Bar dataKey="actual" fill="#ff5b45" radius={[6, 6, 0, 0]} maxBarSize={36} />

            {/* Forecast Prediction Line */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ fill: "#0284c7", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
