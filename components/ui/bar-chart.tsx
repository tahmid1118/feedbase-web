"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

export function ChartBarInteractive({
  perDay,
  title,
}: {
  perDay: { day: string; count: number }[];
  title?: string;
}) {
  const chartData = perDay.map((entry) => ({
    date: entry.day,
    desktop: entry.count,
  }));

  const chartConfig: ChartConfig = {
    desktop: {
      label: "Test Cases",
      color: "var(--chart-2)",
    },
  };

  return (
    <Card className="rounded-2xl shadow-md border border-gray-100 mb-10 py-0">
      <CardHeader className="px-6 pt-4 pb-3">
        <CardTitle>{title || "Test cases ran per day"}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent className="w-[150px]" />
              }
            />
            <Bar dataKey="desktop" fill="var(--chart-2)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
