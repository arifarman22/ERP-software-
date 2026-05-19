"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Lightweight chart components — no external dependency
// For production, swap internals with recharts/chart.js if needed

type BarChartProps = {
  title: string;
  data: { label: string; value: number; color?: string }[];
  className?: string;
};

export function BarChart({ title, data, className }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: item.color || "hsl(var(--primary))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type DonutChartProps = {
  title: string;
  data: { label: string; value: number; color: string }[];
  className?: string;
};

export function DonutChart({ title, data, className }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;

  const segments = data.map((item) => {
    const percent = (item.value / total) * 100;
    const segment = { ...item, percent, offset: cumulativePercent };
    cumulativePercent += percent;
    return segment;
  });

  // Build conic-gradient
  const gradient = segments
    .map((s) => `${s.color} ${s.offset}% ${s.offset + s.percent}%`)
    .join(", ");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div
            className="h-28 w-28 rounded-full shrink-0 relative"
            style={{ background: `conic-gradient(${gradient})` }}
          >
            <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center">
              <span className="text-sm font-bold">{total.toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {segments.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground flex-1">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type LineChartProps = {
  title: string;
  data: { label: string; value: number }[];
  className?: string;
};

export function LineChart({ title, data, className }: LineChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.value - min) / range) * 80 - 10,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 100 100" className="w-full h-40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#lineGradient)" />
          <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="hsl(var(--primary))" />
          ))}
        </svg>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
