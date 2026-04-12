"use client";

import { Calendar } from "@/components/ui/calendar";
import * as React from "react";
import { DateRange } from "react-day-picker";

interface Props {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ value, onChange }: Props) {
  const [range, setRange] = React.useState<DateRange | undefined>(value);

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);
    onChange(selectedRange);
  };

  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={handleSelect}
      numberOfMonths={1}
      defaultMonth={range?.from}
      initialFocus
    />
  );
}
