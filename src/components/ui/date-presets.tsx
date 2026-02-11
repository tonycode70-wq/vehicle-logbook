import React from 'react';
import { addYears } from 'date-fns';
import { Button } from '@/components/ui/button';

interface DatePresetsProps {
  baseDate?: Date;
  onSelect: (date: Date) => void;
  presets?: number[];
}

export function DatePresets({ baseDate, onSelect, presets = [1, 2, 3, 5] }: DatePresetsProps) {
  const base = baseDate || new Date();
  
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {presets.map(years => (
        <Button
          key={years}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={() => onSelect(addYears(base, years))}
        >
          +{years} {years === 1 ? 'anno' : 'anni'}
        </Button>
      ))}
    </div>
  );
}
