"use client";

import { LabelList, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type TestTypeData = {
  type: string;
  count: number;
  fill?: string;
};

interface ChartPieLabelListProps {
  data: TestTypeData[];
  title?: string;
  description?: string;
}

export function ChartPieLabelList({
  data,
  title = "Test Types",
}: ChartPieLabelListProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = data.map((item) => ({
    ...item,
    percentage: ((item.count / total) * 100).toFixed(0) + "%", // Rounded whole percent
  }));

  const chartConfig = Object.fromEntries(
    chartData.map((item) => [
      item.type,
      { label: item.type, color: item.fill ?? "var(--chart-1)" },
    ])
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex flex-wrap gap-2 text-sm mt-1">
          {chartData.map((item) => (
            <span key={item.type} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill ?? "var(--chart-1)" }}
              />
              {item.type}
            </span>
          ))}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="count" hideLabel />}
            />
            <Pie data={chartData} dataKey="count" nameKey="type">
              <LabelList
                dataKey="percentage"
                className="fill-background"
                stroke="none"
                fontSize={12}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
