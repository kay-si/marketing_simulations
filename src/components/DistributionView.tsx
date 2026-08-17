"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  AGE_RANGE_CODES,
  GENDER_CODES,
  HOUSEHOLD_TYPE_CODES,
  INCOME_RANGE_CODES,
} from "@/lib/demographics";
import { StackedBarChart } from "./StackedBarChart";

type DistributionRow = {
  ageRange: number;
  gender: number;
  householdType: number;
  incomeRange: number;
  populationCount: number;
};

export type DistributionFilter = number | "all";

type Props = {
  rows: DistributionRow[];
  incomeFilter: DistributionFilter;
  genderFilter: DistributionFilter;
  onIncomeFilterChange: (value: DistributionFilter) => void;
  onGenderFilterChange: (value: DistributionFilter) => void;
};

type ViewMode = "chart" | "table";

export function DistributionView({
  rows,
  incomeFilter,
  genderFilter,
  onIncomeFilterChange,
  onGenderFilterChange,
}: Props) {
  const t = useTranslations("Table");
  const tChart = useTranslations("Chart");
  const tCodes = useTranslations("Codes");

  const [view, setView] = useState<ViewMode>("chart");

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (incomeFilter === "all" || row.incomeRange === incomeFilter) &&
          (genderFilter === "all" || row.gender === genderFilter),
      ),
    [rows, incomeFilter, genderFilter],
  );

  const total = filteredRows.reduce((sum, row) => sum + row.populationCount, 0);

  const chartData = useMemo(
    () =>
      AGE_RANGE_CODES.map((ageRange) => {
        const segments = HOUSEHOLD_TYPE_CODES.map((householdType) =>
          filteredRows
            .filter((row) => row.ageRange === ageRange && row.householdType === householdType)
            .reduce((sum, row) => sum + row.populationCount, 0),
        ) as [number, number, number, number];
        return {
          ageRange,
          segments,
          total: segments.reduce((sum, value) => sum + value, 0),
        };
      }),
    [filteredRows],
  );

  const ageLabels = AGE_RANGE_CODES.map((code) => tCodes(`ageRange.${code}`));
  const seriesLabels = HOUSEHOLD_TYPE_CODES.map((code) => tCodes(`householdType.${code}`));

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {tChart("incomeLabel")}
          </span>
          <select
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={incomeFilter}
            onChange={(event) =>
              onIncomeFilterChange(
                event.target.value === "all" ? "all" : Number(event.target.value),
              )
            }
          >
            <option value="all">{tChart("allOption")}</option>
            {INCOME_RANGE_CODES.map((code) => (
              <option key={code} value={code}>
                {tCodes(`incomeRange.${code}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {tChart("genderLabel")}
          </span>
          <select
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={genderFilter}
            onChange={(event) =>
              onGenderFilterChange(
                event.target.value === "all" ? "all" : Number(event.target.value),
              )
            }
          >
            <option value="all">{tChart("allOption")}</option>
            {GENDER_CODES.map((code) => (
              <option key={code} value={code}>
                {tCodes(`gender.${code}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-1 rounded border border-zinc-300 p-0.5 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setView("chart")}
            className={`rounded px-3 py-1.5 text-sm ${
              view === "chart"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {tChart("viewChart")}
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded px-3 py-1.5 text-sm ${
              view === "table"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {tChart("viewTable")}
          </button>
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("totalLabel")}: {total.toLocaleString()}
        </span>
      </div>

      {view === "chart" ? (
        <StackedBarChart
          data={chartData}
          ageLabels={ageLabels}
          seriesLabels={seriesLabels}
          totalLabel={t("totalLabel")}
        />
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-zinc-50 text-left dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2 font-medium">{t("columns.ageRange")}</th>
                <th className="px-3 py-2 font-medium">{t("columns.gender")}</th>
                <th className="px-3 py-2 font-medium">{t("columns.householdType")}</th>
                <th className="px-3 py-2 font-medium">{t("columns.incomeRange")}</th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("columns.populationCount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={index} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-1.5">{tCodes(`ageRange.${row.ageRange}`)}</td>
                  <td className="px-3 py-1.5">{tCodes(`gender.${row.gender}`)}</td>
                  <td className="px-3 py-1.5">{tCodes(`householdType.${row.householdType}`)}</td>
                  <td className="px-3 py-1.5">{tCodes(`incomeRange.${row.incomeRange}`)}</td>
                  <td className="px-3 py-1.5 text-right">
                    {row.populationCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
