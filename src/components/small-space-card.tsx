
"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { Space } from "@/lib/types";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { isValid } from "date-fns";
import { cn } from "@/lib/utils";


interface SmallSpaceCardProps {
  space: Space;
  displayTimezone: string;
}

const getEventDateWithTime = (space: Space, timeString: string, baseDate: Date): Date => {
  if (!timeString || !isValid(baseDate)) {
      return new Date(NaN);
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return new Date(NaN);
  }

  const dateStringWithTime = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`;

  try {
    const eventDateInOriginalTz = toDate(dateStringWithTime, { timeZone: space.timezone });
    if (!isValid(eventDateInOriginalTz)) {
        throw new Error("toDate resulted in an invalid date");
    }
    return eventDateInOriginalTz;
  } catch (e) {
    console.error(`Error creating date for timezone ${space.timezone} with string "${dateStringWithTime}"`, e);
    return new Date(NaN);
  }
}

export function SmallSpaceCard({ space, displayTimezone }: SmallSpaceCardProps) {

  if (!space.dateTime || !isValid(space.dateTime)) {
    return (
        <div className="bg-destructive/20 p-2 rounded-md text-xs">
            <p className="font-bold text-destructive">Invalid Date</p>
        </div>
    );
  }

  const eventStartDate = getEventDateWithTime(space, space.startTime, space.dateTime);

  if (!isValid(eventStartDate)) {
       return (
        <div className="bg-destructive/20 p-2 rounded-md text-xs">
            <p className="font-bold text-destructive">Invalid Time</p>
        </div>
    );
  }

  let formattedTime;
  try {
     const startTimeFormatted = formatInTimeZone(eventStartDate, displayTimezone, "h:mm a");
     let endTimeFormatted = '';
     if (space.endTime) {
        const eventEndDate = getEventDateWithTime(space, space.endTime, space.dateTime);
        if(isValid(eventEndDate)) {
          endTimeFormatted = formatInTimeZone(eventEndDate, displayTimezone, "h:mm a");
        }
     }
     formattedTime = endTimeFormatted ? `${startTimeFormatted} - ${endTimeFormatted}` : startTimeFormatted;
  } catch (e) {
    formattedTime = "Invalid Time";
  }
  
  const cardClasses = "block transition-colors p-2 text-xs group border-b border-border/20 hover:bg-background/80";
  
  return (
    <div className={cn(cardClasses)}>
        <div className="flex flex-col text-foreground">
          <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
            <p className="font-bold text-sm whitespace-nowrap">{formattedTime}</p>
          </div>
          <p className="font-semibold leading-tight transition-colors text-primary">{space.name}</p>
        </div>
    </div>
  )
}
