"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ChartBarHorizontalProps = {
  data: { name: string; value: number }[];
  title?: string;
  description?: string;
};

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig;

export function ChartBarHorizontal({
  data,
  title = "Horizontal Bar Chart",
  description = "",
}: ChartBarHorizontalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ right: 16 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 12)}
              hide
            />
            <XAxis type="number" dataKey="value" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="value" fill="#009487" radius={4}>
              <LabelList
                dataKey="name"
                position="insideLeft"
                offset={8}
                className="fill-muted"
                fontSize={12}
              />
              <LabelList
                dataKey="value"
                position="insideRight" // ⬅️ move inside
                offset={8}
                className="fill-background" // use background color for contrast
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
