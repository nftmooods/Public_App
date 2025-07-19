
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Space } from "@/lib/types";
import { SpaceCard } from "./space-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSpaces, getFavorites, addFavorite, removeFavorite } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { 
  addDays, 
  getDay,
  isThisWeek,
  nextDay
} from "date-fns";

// Timezone mapping for the select dropdown
const timezones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "EST" },
    { value: "Europe/Paris", label: "CET" },
    { value: "Asia/Tokyo", label: "JST" },
];

// Utility function to convert Firestore Timestamps to JS Date objects for createdAt
const convertFirestoreTimestamps = (spaces: any[]): Omit<Space, "dateTime">[] => {
  return spaces.map(space => {
    const newSpace = { ...space };
    if (newSpace.createdAt && typeof newSpace.createdAt.toDate === 'function') {
      newSpace.createdAt = newSpace.createdAt.toDate();
    }
    // dayOfWeek, startTime, endTime and timezone are stored directly
    return newSpace;
  });
};

const getUpcomingDateForEvent = (dayOfWeek: number): Date => {
    let eventDate = nextDay(new Date(), dayOfWeek);
    return eventDate;
};


// Custom hook for fetching Space data
const useSpaces = () => {
  const [spaces, setSpaces] = useState<Omit<Space, "dateTime">[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const fetchedSpaces = await getSpaces();
        const processedSpaces = convertFirestoreTimestamps(fetchedSpaces);
        setSpaces(processedSpaces);
      } catch (error) {
        console.error("Error fetching spaces:", error);
        toast({ title: "Error", description: "Could not fetch spaces.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, [toast]);

  return { spaces, loading };
};

// Custom hook for managing favorites
const useFavorites = (user: any) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteDocs, setFavoriteDocs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.uid) {
      const fetchFavorites = async () => {
        const userFavorites = await getFavorites(user.uid);
        setFavoriteDocs(userFavorites);
        setFavorites(userFavorites.map(fav => fav.spaceId));
      };
      fetchFavorites();
    } else {
      setFavorites([]);
      setFavoriteDocs([]);
    }
  }, [user]);

  const toggleFavorite = useCallback(async (spaceId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "You must be logged in to manage favorites." });
      return;
    }

    const isFavorite = favorites.includes(spaceId);
    try {
      if (isFavorite) {
        const favoriteDoc = favoriteDocs.find(doc => doc.spaceId === spaceId);
        if (favoriteDoc) {
          await removeFavorite(favoriteDoc.id);
          setFavorites(prev => prev.filter(id => id !== spaceId));
          setFavoriteDocs(prev => prev.filter(doc => doc.spaceId !== spaceId));
          toast({ title: "Removed from favorites." });
        }
      } else {
        const newFavoriteId = await addFavorite(user.uid, spaceId);
        setFavorites(prev => [...prev, spaceId]);
        setFavoriteDocs(prev => [...prev, { id: newFavoriteId, userId: user.uid, spaceId }]);
        toast({ title: "Added to favorites!" });
      }
    } catch (error) {
      console.error(`Error updating favorites for space ${spaceId}:`, error);
      toast({ title: "Error", description: "Could not update favorites.", variant: "destructive" });
    }
  }, [user, favorites, favoriteDocs, toast]);

  return { favorites, toggleFavorite };
};

export function SpaceSchedule() {
  const [filter, setFilter] = useState("week");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  const { user } = useAuth();
  const { spaces, loading } = useSpaces();
  const { favorites, toggleFavorite } = useFavorites(user);
  
  useEffect(() => {
    // Set local timezone on mount
    if (typeof window !== 'undefined') {
        setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    setIsMounted(true);
  }, []);

  const filteredSpaces = useMemo(() => {
    
    // Map raw space data to Space objects with calculated dateTime
    const spacesWithCalculatedDates: Space[] = spaces.map(s => ({
        ...s,
        dateTime: getUpcomingDateForEvent(s.dayOfWeek)
    }));
    
    const spacesToFilter = showFavorites ? spacesWithCalculatedDates.filter(space => favorites.includes(space.id)) : spacesWithCalculatedDates;

    const filterByDate = (space: Space, check: (date: Date) => boolean) => {
      // The dateTime property is now guaranteed to be a valid Date
      return check(space.dateTime);
    };

    let result: Space[];
    const today = new Date();
    const todayDayOfWeek = getDay(today);

    switch (filter) {
      case "today":
        result = spacesToFilter.filter(space => space.dayOfWeek === todayDayOfWeek);
        break;
      case "tomorrow":
        const tomorrowDayOfWeek = getDay(addDays(today, 1));
        result = spacesToFilter.filter(space => space.dayOfWeek === tomorrowDayOfWeek);
        break;
      case "week":
         result = spacesToFilter.filter(space => 
            // Use isThisWeek with the calculated dateTime. weekStartsOn: 0 means Sunday.
            filterByDate(space, date => isThisWeek(date, { weekStartsOn: 0 }))
         );
        break;
      default:
        result = spacesToFilter;
        break;
    }
    
    // Always sort by date
    return result.sort((a,b) => {
        const dayDiff = a.dayOfWeek - b.dayOfWeek;
        if (dayDiff !== 0) return dayDiff;
        // If same day, sort by start time
        return a.startTime.localeCompare(b.startTime);
    });

  }, [spaces, filter, showFavorites, favorites]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
          Weekly Schedule
        </h1>
        <p className="text-muted-foreground mt-2">
          Your weekly schedule of recurring Twitter Spaces.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="favorites-only"
              checked={showFavorites}
              onCheckedChange={setShowFavorites}
              aria-label="Show favorites only"
              disabled={!user}
            />
            <Label htmlFor="favorites-only" className={!user ? "text-muted-foreground" : ""}>
              Favorites only { !user && "(Login required)"}
            </Label>
          </div>
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone} disabled={!isMounted}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {isMounted && <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>My Timezone</SelectItem>}
              {timezones.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Loading spaces...</p>
            </div>
          ) : filteredSpaces.length > 0 ? (
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
                  displayTimezone={selectedTimezone}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No spaces scheduled for this period.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
