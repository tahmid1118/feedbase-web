"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import * as React from "react";
import { DateRange } from "react-day-picker";

interface Props {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  onClose: () => void;
}

export function DateRangePicker2({ value, onChange, onClose }: Props) {
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(
    value
  );

  const handleSave = () => {
    onChange(tempRange);
    onClose();
  };

  const handleCancel = () => {
    setTempRange(value);
    onClose();
  };

  return (
    <div className="p-3">
      <Calendar
        mode="range"
        selected={tempRange}
        onSelect={setTempRange}
        numberOfMonths={1}
        defaultMonth={tempRange?.from}
        initialFocus
      />
      <div className="flex justify-end gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
