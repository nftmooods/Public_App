
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatInTimeZone as formatInTimezone } from 'date-fns-tz';
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Star, Link as LinkIcon, Calendar, Clock } from "lucide-react";

import type { Space } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SpaceCardProps {
  space: Space;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  displayTimezone: string;
}

export function SpaceCard({ space, isFavorite, onToggleFavorite, displayTimezone }: SpaceCardProps) {
  const [formattedDateTime, setFormattedDateTime] = useState({ date: "", time: "" });

  useEffect(() => {
    try {
      const date = new Date(space.dateTime);
      let dateStr, timeStr, timezoneLabel;
  
      if (displayTimezone === 'local') {
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        dateStr = formatInTimezone(date, localTimezone, "eeee, MMMM d", { locale: enUS });
        timeStr = formatInTimezone(date, localTimezone, "p", { locale: enUS });
        timezoneLabel = localTimezone.split('/').pop()?.replace('_', ' ') || 'Local';
      } else {
        dateStr = formatInTimezone(date, displayTimezone, "eeee, MMMM d", { locale: enUS });
        timeStr = formatInTimezone(date, displayTimezone, "p", { locale: enUS });
        // Find the label from the timezones list for display
        const timezones = [
            { value: "local", label: "My Timezone" },
            { value: "UTC", label: "UTC" },
            { value: "America/New_York", label: "EST" },
            { value: "Europe/Paris", label: "CET" },
            { value: "Asia/Tokyo", label: "JST" },
        ];
        timezoneLabel = timezones.find(tz => tz.value === displayTimezone)?.label || displayTimezone;
      }
  
      setFormattedDateTime({ date: dateStr, time: `${timeStr} (${timezoneLabel})` });

    } catch (error) {
        console.error("Error formatting date:", error);
        setFormattedDateTime({ date: "Invalid date", time: ""});
    }

  }, [space.dateTime, displayTimezone]);

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl pr-4">{space.name}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={onToggleFavorite}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="flex items-center flex-wrap gap-x-4 gap-y-2 pt-2">
            <span className="flex items-center gap-1.5 text-sm capitalize"><Calendar className="w-4 h-4"/> {formattedDateTime.date}</span>
            <span className="flex items-center gap-1.5 text-sm"><Clock className="w-4 h-4"/> {formattedDateTime.time}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"></CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={space.projectUrl} target="_blank" rel="noopener noreferrer">
            <LinkIcon className="mr-2 h-4 w-4" />
            Visit Project Page
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
