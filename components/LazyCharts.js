"use client";
import dynamic from "next/dynamic";

// Recharts is large. Load it on demand so dashboards paint their numbers and tables first.
const fallback = () => <div className="chart-box skeleton" role="status" aria-label="Loading chart" />;

export const BarChartCard = dynamic(() => import("@/components/Charts").then((m) => m.BarChartCard), { ssr: false, loading: fallback });
export const LineChartCard = dynamic(() => import("@/components/Charts").then((m) => m.LineChartCard), { ssr: false, loading: fallback });
