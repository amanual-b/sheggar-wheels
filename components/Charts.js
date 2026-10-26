"use client";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PURPLE = "#6d28d9";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/** Chart + visually-hidden summary. Pair with a visible accessible table for full detail. */
function ChartFrame({ title, summary, children }) {
  const mounted = useMounted();
  return (
    <figure style={{ margin: 0 }}>
      <figcaption className="label" style={{ marginBottom: 8 }}>{title}</figcaption>
      <div className="chart-box" role="img" aria-label={`${title}. ${summary}`}>
        {mounted ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : null}
      </div>
    </figure>
  );
}

export function BarChartCard({ title, data, xKey, yKey, summary, format = (v) => v, color = PURPLE }) {
  return (
    <ChartFrame title={title} summary={summary}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={format} width={64} allowDecimals={false} />
        <Tooltip formatter={(v) => format(v)} />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

export function LineChartCard({ title, data, xKey, yKey, summary, format = (v) => v, color = PURPLE }) {
  return (
    <ChartFrame title={title} summary={summary}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={format} width={64} allowDecimals={false} />
        <Tooltip formatter={(v) => format(v)} />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ChartFrame>
  );
}
