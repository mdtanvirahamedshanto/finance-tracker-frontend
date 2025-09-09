import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimePeriodSelectorProps {
  selectedPeriod: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

export const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }: TimePeriodSelectorProps) => {
  const periodLabels = {
    week: 'This Week',
    month: 'This Month', 
    year: 'This Year'
  };

  return (
    <Card className="p-1 bg-surface shadow-sm border border-border/50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 px-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-200"
          >
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {periodLabels[selectedPeriod]}
            <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
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
    </Card>
  );
};