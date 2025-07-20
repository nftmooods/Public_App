
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLinkIcon, HeartIcon, PencilIcon, Link2Off } from "lucide-react";
import type { Space } from "@/lib/types";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { isValid, addHours } from "date-fns";
import { useMemo } from "react";
import { CertifiedIcon } from "./icons";

interface SpaceCardProps {
  space: Space;
  isFavorite: boolean;
  onToggleFavorite: (spaceId: string) => void;
  displayTimezone: string;
  favoriteCount: number;
}

const contentPlaceTagsValues = ["SPACE", "STREAM", "DISCORD VC"];
const contentTypeTagsValues = ["ApeChain", "NFT", "DeFi", "Gaming", "Art", "Music"];


const getTimezoneAbbreviation = (timezone: string): string => {
    if (!timezone) return "";
    try {
        const long = formatInTimeZone(new Date(), timezone, 'z');
        if (["UTC", "GMT"].includes(long)) return long;
        const short = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value;
        return short || long;
    } catch {
        return "Time";
    }
};

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

export function SpaceCard({ space, isFavorite, onToggleFavorite, displayTimezone, favoriteCount }: SpaceCardProps) {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const { contentPlaceTag, contentTypeTags } = useMemo(() => {
    const tags = space.tags || [];
    const contentPlaceTag = tags.find(tag => contentPlaceTagsValues.includes(tag)) || null;
    const contentTypeTags = tags.filter(tag => contentTypeTagsValues.includes(tag));
    return { contentPlaceTag, contentTypeTags };
  }, [space.tags]);
  
  const allTags = useMemo(() => {
    return [contentPlaceTag, ...contentTypeTags].filter(Boolean) as string[];
  }, [contentPlaceTag, contentTypeTags]);


  if (!space.dateTime || !isValid(space.dateTime)) {
    return (
        <Card className="flex flex-col h-full bg-destructive/10 border-destructive/50">
            <CardHeader>
                <CardTitle className="font-headline text-lg text-destructive">{space.name || "Event Error"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
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

  const eventStartDate = getEventDateWithTime(space, space.startTime, space.dateTime);
  let eventEndDate: Date;

  if (space.endTime) {
    eventEndDate = getEventDateWithTime(space, space.endTime, space.dateTime);
  } else if (isValid(eventStartDate)) {
    eventEndDate = addHours(eventStartDate, 1); // Default to 1 hour duration if no end time
  } else {
    eventEndDate = new Date(NaN);
  }

  if (!isValid(eventStartDate)) {
       return (
        <Card className="flex flex-col h-full bg-destructive/10 border-destructive/50">
            <CardHeader>
                <CardTitle className="font-headline text-lg text-destructive">{space.name || "Event Error"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
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
        if(isValid(eventEndDate)) {
          endTimeFormatted = formatInTimeZone(eventEndDate, displayTimezone, "h:mm a");
        }
     }

     formattedDateTime = {
      day: formatInTimeZone(eventStartDate, displayTimezone, "EEEE"),
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      timeRange: endTimeFormatted ? `${startTimeFormatted} - ${endTimeFormatted}` : startTimeFormatted,
      timezone: getTimezoneAbbreviation(displayTimezone)
    };
  } catch (e) {
    console.error("Error formatting date:", e);
    formattedDateTime = {
      day: "Invalid Day",
      startTime: "Invalid Time",
      endTime: "",
      timeRange: "Invalid Time",
      timezone: "Error"
    }
  }

  const isCreator = user && user.uid === space.createdBy;
  const isCoHost = user && space.coHostName && user.name === space.coHostName;
  const canEdit = isCreator || isCoHost || isSuperAdmin;

  return (
    <Card className="relative flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card text-card-foreground">
      {space.isCertified && <CertifiedIcon className="absolute top-[-10px] right-[-10px] z-10" />}
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              {space.name}
            </CardTitle>
        </div>
        <CardDescription className="text-card-foreground/80 leading-tight flex flex-col pt-1">
            <span>
                <span className="font-semibold">Host:</span> {space.authorName || 'Anonymous'}
            </span>
             <span>
                <span className="font-semibold">Co-host:</span> {space.coHostName || ''}
            </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-1">
        <div className="relative">
             <Badge 
                style={{ backgroundColor: space.dayColor, color: '#002787', borderColor: 'transparent' }}
                className="whitespace-nowrap absolute -top-2 right-2 z-10"
            >
                {formattedDateTime.day}
            </Badge>
            <Alert className="bg-background/10 border-border/30 text-card-foreground overflow-hidden">
                <AlertTitle className="text-2xl font-bold">{formattedDateTime.timeRange}</AlertTitle>
                <AlertDescription className="text-card-foreground/80">
                Timezone: {formattedDateTime.timezone}
                </AlertDescription>
            </Alert>
        </div>
        <div className="bg-card rounded-md px-2 py-1 flex items-center">
            <div className="flex flex-wrap items-center divide-x divide-card-foreground/30 text-sm text-card-foreground font-medium">
              {allTags.map((tag, index) => (
                  <span key={index} className="px-2 first:pl-0 last:pr-0">{tag}</span>
              ))}
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-1 relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(space.id)}
                disabled={!user}
                aria-label="Toggle favorite"
                className="text-card-foreground/60 hover:text-red-500 hover:bg-red-500/10"
            >
                {favoriteCount > 0 && (
                    <span className="absolute -top-1.5 text-xs font-bold text-red-500">
                        +{favoriteCount}
                    </span>
                )}
                <HeartIcon className={`w-5 h-5 transition-colors ${isFavorite ? "text-red-500 fill-current" : ""}`} />
            </Button>
            {canEdit && (
                <Button variant="ghost" size="icon" asChild className="text-card-foreground/60 hover:text-primary hover:bg-primary/10">
                    <Link href={`/edit-space/${space.id}`} aria-label="Edit moment">
                        <PencilIcon className="w-5 h-5" />
                    </Link>
                </Button>
            )}
        </div>
        <div className="flex-grow">
          {space.projectUrl ? (
            <Button asChild className="w-full">
              <a href={space.projectUrl} target="_blank" rel="noopener noreferrer">
                Link <ExternalLinkIcon className="ml-2 w-4 h-4" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" disabled className="w-full gap-2 text-primary-foreground">
              Link not available
              <Link2Off className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
