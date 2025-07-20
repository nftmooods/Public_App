
"use client";

import { useMemo } from "react";
import type { Space } from "@/lib/types";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { isValid, addHours } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, Link2Off, PencilIcon, HeartIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { CertifiedIcon } from "./icons";


interface SpaceDetailDialogProps {
  space: Space | null;
  isOpen: boolean;
  onClose: () => void;
  displayTimezone: string;
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

export function SpaceDetailDialog({ space, isOpen, onClose, displayTimezone }: SpaceDetailDialogProps) {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  const isCreator = user && space && user.uid === space.createdBy;
  const isCoHost = user && space && space.coHostName && user.name === space.coHostName;
  const canEdit = isCreator || isCoHost || isSuperAdmin;


  const { contentPlaceTag, contentTypeTags, formattedDateTime } = useMemo(() => {
    if (!space || !space.dateTime || !isValid(space.dateTime)) {
      return { contentPlaceTag: null, contentTypeTags: [], formattedDateTime: null };
    }
    
    const tags = space.tags || [];
    const contentPlaceTag = tags.find(tag => contentPlaceTagsValues.includes(tag)) || null;
    const contentTypeTags = tags.filter(tag => contentTypeTagsValues.includes(tag));
    
    const eventStartDate = getEventDateWithTime(space, space.startTime, space.dateTime);
    let eventEndDate: Date;
    if (space.endTime) {
        eventEndDate = getEventDateWithTime(space, space.endTime, space.dateTime);
    } else if (isValid(eventStartDate)) {
        eventEndDate = addHours(eventStartDate, 1);
    } else {
        eventEndDate = new Date(NaN);
    }

    if (!isValid(eventStartDate)) {
        return { contentPlaceTag, contentTypeTags, formattedDateTime: null };
    }

    try {
        const startTimeFormatted = formatInTimeZone(eventStartDate, displayTimezone, "h:mm a");
        let endTimeFormatted = '';
        if (space.endTime && isValid(eventEndDate)) {
          endTimeFormatted = formatInTimeZone(eventEndDate, displayTimezone, "h:mm a");
        }
        
        const dt = {
          day: formatInTimeZone(eventStartDate, displayTimezone, "EEEE"),
          timeRange: endTimeFormatted ? `${startTimeFormatted} - ${endTimeFormatted}` : startTimeFormatted,
          timezone: getTimezoneAbbreviation(displayTimezone)
        };
        return { contentPlaceTag, contentTypeTags, formattedDateTime: dt };

    } catch (e) {
      console.error("Error formatting date:", e);
      return { contentPlaceTag, contentTypeTags, formattedDateTime: null };
    }
  }, [space, displayTimezone]);

  if (!space || !formattedDateTime) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-card-foreground">
        <DialogHeader>
             {space.isCertified && <CertifiedIcon className="absolute top-2 right-2 z-20" />}
            <div className="flex justify-between items-start gap-4">
                <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                  {space.name}
                </DialogTitle>
            </div>
            <DialogDescription className="text-card-foreground/80 leading-tight flex flex-col pt-2">
                 <span>
                    <span className="font-semibold">Host:</span> {space.authorName || 'Anonymous'}
                </span>
                <span>
                    <span className="font-semibold">Co-host:</span> {space.coHostName || ''}
                </span>
            </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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

             <div className="flex flex-wrap items-center gap-2">
                {contentPlaceTag && <Badge variant="secondary">{contentPlaceTag}</Badge>}
                {contentTypeTags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <div className="flex justify-between items-center w-full gap-4">
                <div className="flex items-center gap-1">
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
                    <Button asChild size="lg" className="w-full">
                      <a href={space.projectUrl} target="_blank" rel="noopener noreferrer">
                        Link <ExternalLinkIcon className="ml-2 w-4 h-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="lg" disabled className="w-full gap-2 text-primary-foreground">
                      Link not available
                      <Link2Off className="w-4 h-4" />
                    </Button>
                  )}
                </div>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
