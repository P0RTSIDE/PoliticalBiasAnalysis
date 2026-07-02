"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CoverageCategory } from "@/lib/types";

interface CoverageBarChartProps {
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
      <div className="mt-1 space-y-0.5 font-mono text-[11px]">
        <div className="text-left-blindspot">Left coverage: {c.leftCoverage}%</div>
        <div className="text-right-blindspot">Right coverage: {c.rightCoverage}%</div>
        <div className="text-text-secondary">
          Divergence score: {c.divergenceScore}
        </div>
      </div>
    </div>
  );
}

export function CoverageBarChart({ categories }: CoverageBarChartProps) {
  const data = [...categories].sort(
    (a, b) => b.divergenceScore - a.divergenceScore
  );

  return (
    <div className="w-full" style={{ height: Math.max(320, data.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
          barCategoryGap={6}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={{ stroke: "#2A2A2A" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="divergenceScore" radius={0} isAnimationActive>
            {data.map((c) => (
              <Cell key={c.name} fill={leanColor(c)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
