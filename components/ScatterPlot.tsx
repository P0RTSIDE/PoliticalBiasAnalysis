"use client";

import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { CoverageCategory } from "@/lib/types";

interface ScatterPlotProps {
  categories: CoverageCategory[];
}

function leanColor(category: CoverageCategory): string {
  if (category.leftCoverage > category.rightCoverage) return "#3B82F6";
  if (category.rightCoverage > category.leftCoverage) return "#EF4444";
  return "#6B7280";
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const c: CoverageCategory = payload[0].payload;
  return (
    <div className="border border-hairline bg-background px-3 py-2 shadow-xl">
      <div className="font-mono text-[11px] uppercase tracking-wider text-text-primary">
        {c.name}
      </div>
      <div className="mt-1 space-y-0.5 font-mono text-[11px] text-text-secondary">
        <div>Volume: {c.totalVolume} stories</div>
        <div>Partisan gap: {c.divergenceScore}</div>
      </div>
    </div>
  );
}

export function ScatterPlot({ categories }: ScatterPlotProps) {
  const data = categories.map((c) => ({
    ...c,
    x: c.totalVolume,
    y: c.divergenceScore,
  }));

  return (
    <div className="w-full" style={{ height: 380 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 8 }}>
          <CartesianGrid stroke="#2A2A2A" strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="x"
            name="Coverage volume"
            tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={{ stroke: "#2A2A2A" }}
            label={{
              value: "Total coverage volume (stories)",
              position: "bottom",
              offset: 16,
              fill: "#9CA3AF",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Partisan gap"
            domain={[0, 100]}
            tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={{ stroke: "#2A2A2A" }}
            label={{
              value: "Partisan gap score",
              angle: -90,
              position: "insideLeft",
              fill: "#9CA3AF",
              fontSize: 11,
              style: { textAnchor: "middle" },
            }}
          />
          <ZAxis type="number" dataKey="totalVolume" range={[60, 400]} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#F59E0B", strokeDasharray: "3 3" }}
          />
          <Scatter data={data} isAnimationActive>
            {data.map((c) => (
              <Cell
                key={c.name}
                fill={leanColor(c)}
                fillOpacity={0.65}
                stroke={leanColor(c)}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
