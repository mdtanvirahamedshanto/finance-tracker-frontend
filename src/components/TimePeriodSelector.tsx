import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

interface TimePeriodSelectorProps {
  selectedPeriod: 'week' | 'month' | 'year' | 'custom';
  onPeriodChange: (period: 'week' | 'month' | 'year' | 'custom') => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export const TimePeriodSelector = ({ 
  selectedPeriod, 
  onPeriodChange, 
  dateRange, 
  onDateRangeChange 
}: TimePeriodSelectorProps) => {
  const periodLabels = {
    week: 'This Week',
    month: 'This Month', 
    year: 'This Year',
    custom: 'Custom Range'
  };

  return (
    <Card className="p-1 bg-surface shadow-sm border border-border/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 px-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-200 w-full sm:w-auto justify-between"
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                {periodLabels[selectedPeriod]}
              </div>
              <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100%-1rem)] sm:w-40">
            {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map((period) => (
              <DropdownMenuItem
                key={period}
                onClick={() => onPeriodChange(period)}
                className={`cursor-pointer ${selectedPeriod === period ? 'bg-primary/10 text-primary' : ''}`}
              >
                {periodLabels[period]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {selectedPeriod === 'custom' && onDateRangeChange && (
          <div className="w-full sm:ml-2">
            <DatePickerWithRange 
              date={dateRange} 
              setDate={onDateRangeChange} 
              className="h-8 w-full"
            />
          </div>
        )}
      </div>
    </Card>
  );
};