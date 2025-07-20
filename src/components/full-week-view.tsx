
"use client";

import { useMemo } from 'react';
import type { Space } from '@/lib/types';
import { SmallSpaceCard } from './small-space-card';

interface FullWeekViewProps {
  spaces: Space[];
  displayTimezone: string;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday -> Sunday

export function FullWeekView({ spaces, displayTimezone }: FullWeekViewProps) {

  const spacesByDay = useMemo(() => {
    const grouped: { [key: number]: Space[] } = {};
    dayOrder.forEach(day => grouped[day] = []);

    spaces.forEach(space => {
      if (grouped[space.dayOfWeek] !== undefined) {
        grouped[space.dayOfWeek].push(space);
      }
    });

    // Sort spaces within each day by start time
    for (const day in grouped) {
        grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    
    return grouped;
  }, [spaces]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 items-start">
      {dayOrder.map(dayIndex => {
        const hasEvents = spacesByDay[dayIndex] && spacesByDay[dayIndex].length > 0;
        const dayColor = hasEvents ? spacesByDay[dayIndex][0].dayColor : 'hsl(var(--muted))';
        const textColor = hasEvents ? '#002787' : 'hsl(var(--primary-foreground))';

        return (
            <div 
            key={dayIndex} 
            className="bg-card text-card-foreground rounded-lg p-2 flex flex-col gap-2 min-h-[200px]"
            >
            <h2 
                className="text-center font-headline text-xl font-bold p-2 rounded"
                style={{ backgroundColor: dayColor, color: textColor }}
            >
                {dayNames[dayIndex]}
            </h2>
            <div className="flex flex-col gap-2">
                {hasEvents ? (
                spacesByDay[dayIndex].map(space => (
                    <SmallSpaceCard 
                    key={space.id} 
                    space={space} 
                    displayTimezone={displayTimezone} 
                    />
                ))
                ) : (
                <p className="text-center text-sm text-muted-foreground pt-4">No events scheduled.</p>
                )}
            </div>
            </div>
        )
      })}
    </div>
  );
}
