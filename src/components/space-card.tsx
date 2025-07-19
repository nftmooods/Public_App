
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLinkIcon, HeartIcon, Share2Icon, PencilIcon } from "lucide-react";
import type { Space } from "@/lib/types";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SpaceCardProps {
  space: Space;
  isFavorite: boolean;
  onToggleFavorite: (spaceId: string) => void;
  displayTimezone: string;
}

const getTimezoneAbbreviation = (timezone: string): string => {
    if (!timezone || timezone === 'local') return "Local";
    try {
        const long = formatInTimeZone(new Date(), timezone, 'z');
        if (["UTC", "GMT"].includes(long)) return long;
        const short = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value;
        return short || long;
    } catch {
        return "Time"; // Fallback
    }
};

const getEventDateWithTime = (space: Space, timeString: string, baseDate: Date): Date => {
  // 1. Create a date object from the stored time in its native timezone
  const [hours, minutes] = timeString.split(':').map(Number);
  // We need a base date to combine with the time. The dynamically calculated space.dateTime is perfect.
  const dateStringWithTime = `${baseDate.getFullYear()}-${baseDate.getMonth() + 1}-${baseDate.getDate()}T${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:00`;

  // Use toDate to parse the date string within the event's *own* timezone
  const eventDateInOriginalTz = toDate(dateStringWithTime, { timeZone: space.timezone });

  return eventDateInOriginalTz;
}

export function SpaceCard({ space, isFavorite, onToggleFavorite, displayTimezone }: SpaceCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [effectiveTimezone, setEffectiveTimezone] = useState(displayTimezone);
  
  useEffect(() => {
    if (displayTimezone === 'local') {
      setEffectiveTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } else {
      setEffectiveTimezone(displayTimezone);
    }
  }, [displayTimezone]);
  
  if (!space.dateTime) {
    // This can happen briefly while data is loading. Render a placeholder.
    return <Card className="flex flex-col h-full bg-muted/50 opacity-70"></Card>;
  }

  // Get the absolute point-in-time for the event start
  const eventStartDate = getEventDateWithTime(space, space.startTime, space.dateTime);
  
  let formattedDateTime;
  try {
     const startTimeFormatted = formatInTimeZone(eventStartDate, effectiveTimezone, "h:mm a");
     let endTimeFormatted = '';
     if (space.endTime) {
        const eventEndDate = getEventDateWithTime(space, space.endTime, space.dateTime);
        endTimeFormatted = formatInTimeZone(eventEndDate, effectiveTimezone, "h:mm a");
     }

     formattedDateTime = {
      day: formatInTimeZone(eventStartDate, effectiveTimezone, "EEEE"), // Monday, Tuesday, etc.
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      timeRange: endTimeFormatted ? `${startTimeFormatted} - ${endTimeFormatted}` : startTimeFormatted,
      timezone: getTimezoneAbbreviation(effectiveTimezone)
    };
  } catch (e) {
    console.error("Error formatting date:", e);
    // Fallback in case of an invalid timezone identifier
    formattedDateTime = {
      day: "Invalid Day",
      startTime: "Invalid Time",
      endTime: "",
      timeRange: "Invalid Time",
      timezone: "Error"
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/space/${space.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
        title: "Link Copied!",
        description: "The link to this space has been copied to your clipboard.",
    });
  };

  const canEdit = user && user.uid === space.createdBy;

  return (
    <Card className={`flex flex-col h-full transition-all duration-300 bg-card`}>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <CardTitle className="font-headline text-xl">{space.name}</CardTitle>
            <div className="flex flex-col items-end gap-2">
                 <Badge variant={"outline"} className="whitespace-nowrap flex-shrink-0">
                    {formattedDateTime.day}
                </Badge>
                {space.tag && <Badge variant={"secondary"} className="whitespace-nowrap flex-shrink-0">{space.tag}</Badge>}
            </div>
        </div>
        <CardDescription>by {space.authorName || 'Anonymous'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Alert>
          <AlertTitle className="text-2xl font-bold">{formattedDateTime.timeRange}</AlertTitle>
          <AlertDescription>
            Timezone: {formattedDateTime.timezone}
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(space.id)}
                disabled={!user}
                aria-label="Toggle favorite"
            >
                <HeartIcon className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share space">
                <Share2Icon className="w-5 h-5" />
            </Button>
            {canEdit && (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/edit-space/${space.id}`} aria-label="Edit space">
                        <PencilIcon className="w-5 h-5" />
                    </Link>
                </Button>
            )}
        </div>
        <Button asChild>
          <a href={space.projectUrl} target="_blank" rel="noopener noreferrer">
            Project Link <ExternalLinkIcon className="ml-2 w-4 h-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
