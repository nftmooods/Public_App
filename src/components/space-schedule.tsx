
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Space } from "@/lib/types";
import { SpaceCard } from "./space-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSpaces, getFavorites, addFavorite, removeFavorite } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { toDate } from 'date-fns-tz';
import { 
  addDays, 
  getDay,
  isValid,
  addHours
} from "date-fns";
import { FullWeekView } from "./full-week-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { timezones as cityTimezones } from "@/lib/timezones";
import { ScrollArea } from "./ui/scroll-area";

const dayColors: { [key: number]: string } = {
    0: '#EAEAEA', // Sunday
    1: '#BE82CF', // Monday
    2: '#DD8298', // Tuesday
    3: '#EB8E85', // Wednesday
    4: '#EBA18E', // Thursday
    5: '#EBB596', // Friday
    6: '#CCC5BB', // Saturday
};

const convertFirestoreTimestamps = (spaces: any[]): Omit<Space, "dateTime" | "dayColor">[] => {
  return spaces.map(space => {
    const newSpace = { ...space };
    if (newSpace.createdAt && typeof newSpace.createdAt.toDate === 'function') {
      newSpace.createdAt = newSpace.createdAt.toDate();
    }
    return newSpace;
  });
};

const getUpcomingDateForEvent = (dayOfWeek: number): Date => {
    const today = new Date();
    const currentDay = getDay(today);
    const distance = (dayOfWeek - currentDay + 7) % 7;
    const nextEventDate = addDays(today, distance);
    return nextEventDate;
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

const useSpaces = () => {
  const [spaces, setSpaces] = useState<Omit<Space, "dateTime" | "dayColor">[]>([]);
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
        toast({ title: "Error", description: "Could not fetch moments.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, [toast]);

  return { spaces, loading };
};

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
  const [filter, setFilter] = useState<"week" | "today" | "tomorrow" | "full" | "live">("week");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMySpaces, setShowMySpaces] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  const { user } = useAuth();
  const { spaces, loading } = useSpaces();
  const { favorites, toggleFavorite } = useFavorites(user);
  
  useEffect(() => {
    setIsMounted(true);
    if (user?.timezone) {
      setSelectedTimezone(user.timezone);
    } else if (typeof window !== 'undefined') {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const exists = cityTimezones.some(tz => tz.value === detectedTimezone);
        if (exists) {
          setSelectedTimezone(detectedTimezone);
        } else {
           setSelectedTimezone('UTC');
        }
    }
  }, [user?.timezone]);

  useEffect(() => {
    if (isMobile && filter === 'full') {
        setFilter('week');
    }
  }, [isMobile, filter]);
  
  const handleShowFavoritesChange = (checked: boolean) => {
    setShowFavorites(checked);
    if (checked) {
      setShowMySpaces(false);
    }
  };

  const handleShowMySpacesChange = (checked: boolean) => {
    setShowMySpaces(checked);
    if (checked) {
      setShowFavorites(false);
    }
  };

  const filteredSpaces = useMemo(() => {
    
    // Filter for active spaces first
    const activeSpaces = spaces.filter(s => s.isActive === undefined || s.isActive === true);

    const spacesWithCalculatedDates: Space[] = activeSpaces.map(s => ({
        ...s,
        dateTime: getUpcomingDateForEvent(s.dayOfWeek),
        dayColor: dayColors[s.dayOfWeek] || "#718096"
    }));
    
    let spacesToFilter = spacesWithCalculatedDates;

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        spacesToFilter = spacesToFilter.filter(space => 
            space.name.toLowerCase().includes(lowercasedQuery) ||
            (space.authorName && space.authorName.toLowerCase().includes(lowercasedQuery)) ||
            (space.coHostName && space.coHostName.toLowerCase().includes(lowercasedQuery))
        );
    }
    
    if (showFavorites) {
        spacesToFilter = spacesToFilter.filter(space => favorites.includes(space.id));
    } else if (showMySpaces && user) {
        spacesToFilter = spacesToFilter.filter(space => space.createdBy === user.uid);
    }

    let result: Space[];
    const today = new Date();
    const todayDayOfWeek = getDay(today);

    switch (filter) {
      case "live":
        const now = new Date();
        result = spacesToFilter.filter(space => {
            const eventStartDate = getEventDateWithTime(space, space.startTime, space.dateTime!);
            let eventEndDate: Date;
             if (space.endTime) {
                eventEndDate = getEventDateWithTime(space, space.endTime, space.dateTime!);
            } else if (isValid(eventStartDate)) {
                eventEndDate = addHours(eventStartDate, 1);
            } else {
                eventEndDate = new Date(NaN);
            }
            return isValid(eventStartDate) && isValid(eventEndDate) && now >= eventStartDate && now <= eventEndDate;
        });
        break;
      case "today":
        result = spacesToFilter.filter(space => space.dayOfWeek === todayDayOfWeek);
        break;
      case "tomorrow":
        const tomorrowDayOfWeek = getDay(addDays(today, 1));
        result = spacesToFilter.filter(space => space.dayOfWeek === tomorrowDayOfWeek);
        break;
      case "week":
      case "full":
         result = spacesToFilter;
        break;
      default:
        result = spacesToFilter;
        break;
    }
    
    return result.sort((a,b) => {
        const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
        const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
        const dayDiff = dayA - dayB;
        if (dayDiff !== 0) return dayDiff;
        
        return a.startTime.localeCompare(b.startTime);
    });

  }, [spaces, filter, showFavorites, showMySpaces, favorites, user, searchQuery]);
  
  const effectiveTimezone = isMounted ? selectedTimezone : "UTC";

  const renderContent = () => {
    if (loading) {
       return (
            <div className="flex-1 flex items-center justify-center text-center py-12">
                <p className="text-muted-foreground">Loading moments...</p>
            </div>
          )
    }

    if (filter === 'full' && !isMobile) {
        return (
          <div className="flex-1 overflow-y-auto">
            <FullWeekView spaces={filteredSpaces} displayTimezone={effectiveTimezone} />
          </div>
        )
    }

    return (
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
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
                        displayTimezone={effectiveTimezone}
                        />
                    </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">No moments found for your criteria.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </ScrollArea>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
          Community Schedule
        </h1>
        <p className="text-muted-foreground mt-2">
          Your central hub for community events and moments.
        </p>
      </div>
      
      <div className="space-y-4 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                {!isMobile && <TabsTrigger value="full">Full View</TabsTrigger>}
            </TabsList>
            </Tabs>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
                <Switch
                id="favorites-only"
                checked={showFavorites}
                onCheckedChange={handleShowFavoritesChange}
                aria-label="Show favorites only"
                disabled={!user}
                />
                <Label htmlFor="favorites-only" className={!user ? "text-muted-foreground" : ""}>
                Favorites only { !user && "(Login required)"}
                </Label>
            </div>
            <div className="flex items-center space-x-2">
                <Switch
                id="my-spaces-only"
                checked={showMySpaces}
                onCheckedChange={handleShowMySpacesChange}
                aria-label="Show my moments only"
                disabled={!user}
                />
                <Label htmlFor="my-spaces-only" className={!user ? "text-muted-foreground" : ""}>
                My Moments { !user && "(Login required)"}
                </Label>
            </div>
            <Select value={effectiveTimezone} onValueChange={setSelectedTimezone} disabled={!isMounted}>
                <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                {cityTimezones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        </div>
        <div className="relative">
            <Input
            placeholder="Search by name, host, or co-host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            />
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
