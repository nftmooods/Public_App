
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLinkIcon, HeartIcon, Share2Icon, PencilIcon, AlertCircle } from "lucide-react";
import type { Space } from "@/lib/types";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isValid } from "date-fns";

interface SpaceCardProps {
  space: Space;
  isFavorite: boolean;
  onToggleFavorite: (spaceId: string) => void;
  displayTimezone: string;
}

const getTimezoneAbbreviation = (timezone: string): string => {
    if (!timezone) return "";
    try {
        const long = formatInTimeZone(new Date(), timezone, 'z');
        if (["UTC", "GMT"].includes(long)) return long;
        // Attempt to get a short abbreviation
        const short = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value;
        return short || long; // Fallback to the long name if short isn't available
    } catch {
        return "Time"; // Fallback for invalid timezone identifiers
    }
};

const getEventDateWithTime = (space: Space, timeString: string, baseDate: Date): Date => {
  if (!timeString || !isValid(baseDate)) {
      return new Date(NaN); // Return an invalid date
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return new Date(NaN);
  }

  const dateStringWithTime = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`;

  try {
    const eventDateInOriginalTz = toDate(dateStringWithTime, { timeZone: space.timezone });
    // Final check to ensure the created date is valid
    if (!isValid(eventDateInOriginalTz)) {
        throw new Error("toDate resulted in an invalid date");
    }
    return eventDateInOriginalTz;
  } catch (e) {
    console.error(`Error creating date for timezone ${space.timezone} with string "${dateStringWithTime}"`, e);
    return new Date(NaN);
  }
}

export function SpaceCard({ space, isFavorite, onToggleFavorite, displayTimezone }: SpaceCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  if (!space.dateTime || !isValid(space.dateTime)) {
    return (
        <Card className="flex flex-col h-full bg-destructive/10 border-destructive/50">
            <CardHeader>
                <CardTitle className="font-headline text-lg text-destructive">{space.name || "Event Error"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid Date</AlertTitle>
                    <AlertDescription>
                        There was a problem calculating the date for this event.
                    </AlertDescription>
                </Alert>
            </CardContent>
             <CardFooter></CardFooter>
        </Card>
    );
  }

  // Get the absolute point-in-time for the event start
  const eventStartDate = getEventDateWithTime(space, space.startTime, space.dateTime);
  
  if (!isValid(eventStartDate)) {
       return (
        <Card className="flex flex-col h-full bg-destructive/10 border-destructive/50">
            <CardHeader>
                <CardTitle className="font-headline text-lg text-destructive">{space.name || "Event Error"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid Time</AlertTitle>
                    <AlertDescription>
                        Could not calculate a valid time for this event.
                    </AlertDescription>
                </Alert>
            </CardContent>
             <CardFooter></CardFooter>
        </Card>
    );
  }

  let formattedDateTime;
  try {
     const startTimeFormatted = formatInTimeZone(eventStartDate, displayTimezone, "h:mm a");
     let endTimeFormatted = '';
     if (space.endTime) {
        const eventEndDate = getEventDateWithTime(space, space.endTime, space.dateTime);
        if(isValid(eventEndDate)) {
          endTimeFormatted = formatInTimeZone(eventEndDate, displayTimezone, "h:mm a");
        }
     }

     formattedDateTime = {
      day: formatInTimeZone(eventStartDate, displayTimezone, "EEEE"), // Monday, Tuesday, etc.
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      timeRange: endTimeFormatted ? `${startTimeFormatted} - ${endTimeFormatted}` : startTimeFormatted,
      timezone: getTimezoneAbbreviation(displayTimezone)
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
    <Card className={`flex flex-col h-full transition-all duration-300 bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30 shadow-lg hover:shadow-primary/20`}>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <CardTitle className="font-headline text-xl text-primary-foreground">{space.name}</CardTitle>
            <div className="flex flex-col items-end gap-2">
                 <Badge variant={"outline"} className="whitespace-nowrap flex-shrink-0 border-primary-foreground/50 text-primary-foreground/80">
                    {formattedDateTime.day}
                </Badge>
                {space.tag && <Badge variant={"secondary"} className="whitespace-nowrap flex-shrink-0">{space.tag}</Badge>}
            </div>
        </div>
        <CardDescription className="text-foreground/70">by {space.authorName || 'Anonymous'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Alert className="bg-background/20 border-transparent text-foreground">
          <AlertTitle className="text-2xl font-bold">{formattedDateTime.timeRange}</AlertTitle>
          <AlertDescription className="text-foreground/80">
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
                <HeartIcon className={`w-5 h-5 transition-colors ${isFavorite ? "text-red-500 fill-current" : "text-foreground/70 hover:text-white"}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share space" className="text-foreground/70 hover:text-white">
                <Share2Icon className="w-5 h-5" />
            </Button>
            {canEdit && (
                <Button variant="ghost" size="icon" asChild className="text-foreground/70 hover:text-white">
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
