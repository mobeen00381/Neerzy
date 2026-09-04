// src/components/admin/Charts.tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import type { DayBucket, MonthBucket, PlanBucket } from "@/lib/admin-types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const GRID = { display: false };
const TICKS = { color: "#5B6B64", font: { size: 10, weight: 600 } as const };
const GRID_LINE = { color: "#E1E8E4" };

export function SignupLineChart({ data }: { data: DayBucket[] }) {
  const labels = data.map((d) => {
    const dt = new Date(d.date + "T00:00:00");
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  });
  return (
    <div className="h-56 relative">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "New signups",
              data: data.map((d) => d.count),
              borderColor: "#22C55E",
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              fill: true,
              tension: 0.35,
              pointRadius: 3,
              pointBackgroundColor: "#22C55E",
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: GRID, ticks: { ...TICKS, maxRotation: 45, autoSkip: true } },
            y: { grid: GRID_LINE, ticks: { ...TICKS, precision: 0 } },
          },
        }}
      />
    </div>
  );
}

export function RevenueBarChart({ data }: { data: MonthBucket[] }) {
  return (
    <div className="h-56 relative">
      <Bar
        data={{
          labels: data.map((d) => {
            const [y, m] = d.month.split("-");
            const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${names[Number(m) - 1]} ${y.slice(2)}`;
          }),
          datasets: [
            {
              label: "Revenue",
              data: data.map((d) => d.revenue),
              backgroundColor: "#0F5132",
              hoverBackgroundColor: "#0B3D2E",
              borderRadius: 6,
              maxBarThickness: 34,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${Number(ctx.raw).toLocaleString(undefined, { style: "currency", currency: "USD" })}`,
              },
            },
          },
          scales: {
            x: { grid: GRID, ticks: TICKS },
            y: { grid: GRID_LINE, ticks: { ...TICKS, callback: (v) => `$${v}` } },
          },
        }}
      />
    </div>
  );
}

export function PlanDoughnutChart({ breakdown }: { breakdown: PlanBucket[] }) {
  const order = ["free", "pro", "growth", "agency"];
  const sorted = [...breakdown].sort((a, b) => order.indexOf(a.plan) - order.indexOf(b.plan));
  const colors: Record<string, string> = {
    free: "#D3E6DA",
    pro: "#22C55E",
    growth: "#0F5132",
    agency: "#0B3D2E",
  };
  return (
    <div className="h-56 relative flex items-center justify-center">
      <Doughnut
        data={{
          labels: sorted.map((s) => s.plan),
          datasets: [
            {
              data: sorted.map((s) => s.count),
              backgroundColor: sorted.map((s) => colors[s.plan] || "#D3E6DA"),
              borderWidth: 2,
              borderColor: "#ffffff",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 10, boxHeight: 10, font: { size: 11, weight: 700 }, color: "#5B6B64" },
            },
          },
        }}
      />
    </div>
  );
}
