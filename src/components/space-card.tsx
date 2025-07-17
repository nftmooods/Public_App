"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLinkIcon, HeartIcon, Share2Icon } from "lucide-react";
import type { Space } from "@/lib/types";
import { format as formatTZ, toDate } from 'date-fns-tz';
import { format, isPast } from 'date-fns';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

interface SpaceCardProps {
  space: Space;
  isFavorite: boolean;
  onToggleFavorite: (spaceId: string) => void;
  displayTimezone: string;
}

const getTimezoneAbbreviation = (timezone: string): string => {
    try {
        const long = formatTZ(new Date(), 'z', { timeZone: timezone });
        if (["UTC", "GMT"].includes(long)) return long;
        const short = long.split(" ").map(word => word[0]).join("");
        return short || "TZ";
    } catch {
        return "Time";
    }
};

export function SpaceCard({ space, isFavorite, onToggleFavorite, displayTimezone }: SpaceCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Assurez-vous que space.dateTime est un objet Date
  const eventDate = typeof space.dateTime === 'string' ? new Date(space.dateTime) : space.dateTime;
  const isEventPast = isPast(eventDate);

  const formattedDateTime = {
      date: format(eventDate, "MMMM d, yyyy"),
      time: displayTimezone === 'local' 
        ? format(eventDate, "h:mm a")
        : formatTZ(eventDate, "h:mm a", { timeZone: displayTimezone }),
      timezone: displayTimezone === 'local' ? "Local" : getTimezoneAbbreviation(displayTimezone)
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/space/${space.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
        title: "Link Copied!",
        description: "The link to this space has been copied to your clipboard.",
    });
  };

  return (
    <Card className={`flex flex-col h-full transition-all duration-300 ${isEventPast ? "bg-muted/50 opacity-70" : "bg-card"}`}>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <CardTitle className="font-headline text-xl">{space.name}</CardTitle>
            <Badge variant={isEventPast ? "secondary" : "default"} className="whitespace-nowrap flex-shrink-0">
                {isEventPast ? "Ended" : "Upcoming"}
            </Badge>
        </div>
        <CardDescription>by {space.authorName || 'Anonymous'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Alert>
          <AlertTitle className="text-2xl font-bold">{formattedDateTime.time}</AlertTitle>
          <AlertDescription>
            {formattedDateTime.date} ({formattedDateTime.timezone})
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
