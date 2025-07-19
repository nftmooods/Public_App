
"use client";

import { Badge } from "@/components/ui/badge";
import type { Space } from "@/lib/types";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { isValid } from "date-fns";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

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

  return (
    <Link href={space.projectUrl} target="_blank" rel="noopener noreferrer" className="block bg-background/50 hover:bg-background/80 transition-colors p-2 rounded-md text-xs group">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <p className="font-bold text-foreground text-sm">{formattedTime}</p>
          {space.tag && <Badge variant="secondary" className="scale-75 origin-right">{space.tag}</Badge>}
        </div>
        <p className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{space.name}</p>
        <p className="text-muted-foreground truncate">{space.authorName}</p>
      </div>
    </Link>
  );
}
