"use client";

import { useState, useMemo, useEffect } from "react";
import type { Space } from "@/lib/types";
import { SpaceCard } from "./space-card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "framer-motion";
import { isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

interface SpaceScheduleProps {
  initialSpaces: Space[];
}

export function SpaceSchedule({ initialSpaces }: SpaceScheduleProps) {
  const [spaces, setSpaces] = useState(initialSpaces);
  const [filter, setFilter] = useState("today");
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useLocalStorage<string[]>("favorites", []);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleFavorite = (spaceId: string) => {
    setFavorites(
      favorites.includes(spaceId)
        ? favorites.filter((id) => id !== spaceId)
        : [...favorites, spaceId]
    );
  };

  const filteredSpaces = useMemo(() => {
    let result = spaces;

    if (showFavorites && isMounted) {
      result = result.filter((space) => favorites.includes(space.id));
    }

    switch (filter) {
      case "today":
        return result.filter((space) => isToday(parseISO(space.dateTime)));
      case "tomorrow":
        return result.filter((space) => isTomorrow(parseISO(space.dateTime)));
      case "week":
        return result.filter((space) => isThisWeek(parseISO(space.dateTime), { weekStartsOn: 1 }));
      default:
        return result;
    }
  }, [spaces, filter, showFavorites, favorites, isMounted]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
          Upcoming Spaces
        </h1>
        <p className="text-muted-foreground mt-2">
          Your daily schedule of Twitter Spaces. All times are shown in your local timezone.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
          </TabsList>
        </Tabs>
        {isMounted && (
            <div className="flex items-center space-x-2">
            <Switch
                id="favorites-only"
                checked={showFavorites}
                onCheckedChange={setShowFavorites}
                aria-label="Show favorites only"
            />
            <Label htmlFor="favorites-only">Show Favorites</Label>
            </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredSpaces.length > 0 ? (
            filteredSpaces.map((space) => (
              <motion.div
                key={space.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <SpaceCard
                  space={space}
                  isFavorite={favorites.includes(space.id)}
                  onToggleFavorite={() => toggleFavorite(space.id)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <p className="text-muted-foreground">No spaces scheduled for this period.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
