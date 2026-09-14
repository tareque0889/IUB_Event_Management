/**
 * AdminEngagementChart.tsx
 *
 * The recharts bar chart used by AdminDashboardPage. Lives in its own module
 * so the ~300 KB recharts (+ lodash/d3) bundle is only fetched when a club
 * admin actually opens the dashboard — import it with React.lazy.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface EngagementDatum {
  id: string;
  name: string;
  registrations: number;
  checkedIn: number;
}

export default function AdminEngagementChart({
  data,
}: {
  data: EngagementDatum[];
}) {
  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(160, data.length * 46)}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        barCategoryGap={12}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 11, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <RTooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            borderRadius: 12,
            border: "2px solid var(--border)",
            fontSize: 12,
            fontFamily: "monospace",
          }}
          formatter={(value: number, name: string) => [
            value,
            name === "registrations" ? "Registered" : "Checked in",
          ]}
        />
        <Bar
          dataKey="registrations"
          radius={[0, 6, 6, 0]}
          fill="var(--primary)"
        >
          {data.map((d) => (
            <Cell key={d.id} fill="var(--primary)" />
          ))}
        </Bar>
        <Bar
          dataKey="checkedIn"
          radius={[0, 6, 6, 0]}
          fill="var(--quaternary)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
