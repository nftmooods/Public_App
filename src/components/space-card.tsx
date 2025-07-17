"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
}

export function SpaceCard({ space, isFavorite, onToggleFavorite }: SpaceCardProps) {
  const [localDateTime, setLocalDateTime] = useState({ date: "", time: "" });

  useEffect(() => {
    const date = new Date(space.dateTime);
    setLocalDateTime({
      date: format(date, "eeee dd MMMM", { locale: fr }),
      time: format(date, "p", { locale: fr }),
    });
  }, [space.dateTime]);

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
                  aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
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
                <p>{isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="flex items-center flex-wrap gap-x-4 gap-y-2 pt-2">
            <span className="flex items-center gap-1.5 text-sm capitalize"><Calendar className="w-4 h-4"/> {localDateTime.date}</span>
            <span className="flex items-center gap-1.5 text-sm"><Clock className="w-4 h-4"/> {localDateTime.time}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"></CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={space.projectUrl} target="_blank" rel="noopener noreferrer">
            <LinkIcon className="mr-2 h-4 w-4" />
            Visiter la page du projet
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
