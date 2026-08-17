"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { HOUSEHOLD_TYPE_COLORS } from "@/lib/chartColors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type BarDatum = {
  ageRange: number;
  segments: readonly [number, number, number, number];
  total: number;
};

type Props = {
  data: BarDatum[];
  ageLabels: string[];
  seriesLabels: string[];
  totalLabel: string;
};

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setIsDark(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return isDark;
}

export function StackedBarChart({ data, ageLabels, seriesLabels, totalLabel }: Props) {
  const isDark = useIsDarkMode();
  const mutedText = isDark ? "#c3c2b7" : "#52514e";
  const gridColor = isDark ? "#2c2c2a" : "#e1e0d9";
  const totals = data.map((datum) => datum.total);

  const datasets = HOUSEHOLD_TYPE_COLORS.map((color, seriesIndex) => ({
    label: seriesLabels[seriesIndex],
    data: data.map((datum) => datum.segments[seriesIndex]),
    backgroundColor: isDark ? color.dark : color.light,
    stack: "total",
    borderRadius:
      seriesIndex === HOUSEHOLD_TYPE_COLORS.length - 1
        ? { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }
        : 0,
    borderSkipped: false as const,
    maxBarThickness: 24,
  }));

  return (
    <div className="h-80 w-full">
      <Bar
        data={{ labels: data.map((datum) => ageLabels[datum.ageRange]), datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { color: mutedText },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: {
                color: mutedText,
                callback: (value) => Number(value).toLocaleString(),
              },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: mutedText, usePointStyle: true, boxWidth: 8 },
            },
            tooltip: {
              backgroundColor: isDark ? "#1a1a19" : "#ffffff",
              titleColor: isDark ? "#ffffff" : "#0b0b0b",
              bodyColor: isDark ? "#ffffff" : "#0b0b0b",
              footerColor: isDark ? "#ffffff" : "#0b0b0b",
              footerFont: { weight: "bold" as const },
              borderColor: gridColor,
              borderWidth: 1,
              padding: 10,
              usePointStyle: true,
              callbacks: {
                label: (item: TooltipItem<"bar">) =>
                  `${item.dataset.label}: ${Number(item.raw).toLocaleString()}`,
                footer: (items: TooltipItem<"bar">[]) => {
                  const index = items[0]?.dataIndex ?? 0;
                  return `${totalLabel}: ${(totals[index] ?? 0).toLocaleString()}`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
