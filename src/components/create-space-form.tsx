
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { addSpace } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { Space } from '@/lib/types';
import { timezones as cityTimezones } from "@/lib/timezones";


const daysOfWeek = [
    { id: '1', label: "Monday" },
    { id: '2', label: "Tuesday" },
    { id: '3', label: "Wednesday" },
    { id: '4', label: "Thursday" },
    { id: '5', label: "Friday" },
    { id: '6', label: "Saturday" },
    { id: '0', label: "Sunday" },
];

const eventTags = [
    { value: "SPACE", label: "SPACE" },
    { value: "STREAM", label: "STREAM" },
    { value: "DISCORD VC", label: "DISCORD VC" },
];

const communityTags = [
    { value: "NFT", label: "NFT" },
    { value: "DeFi", label: "DeFi" },
    { value: "Gaming", label: "Gaming" },
    { value: "DAO", label: "DAO" },
    { value: "Art", label: "Art" },
    { value: "Music", label: "Music" },
];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours >= 2 && hours < 5) {
      return null;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  const timeValue = `${hours.toString().padStart(2, '0')}:${displayMinutes}`;
  const timeLabel = `${displayHours}:${displayMinutes} ${period}`;
  return { value: timeValue, label: timeLabel };
}).filter(Boolean) as { value: string; label: string }[];


const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  projectUrl: z.string().url({ message: "Please enter a valid URL." }),
  authorName: z.string(), // This is now read-only, populated from auth context
  tags: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one tag.",
  }),
  daysOfWeek: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one day.",
  }),
  startTime: z.string().min(1, { message: "Please select a start time." }),
  endTime: z.string().optional(),
  timezone: z.string().min(1, { message: "Please select a timezone." }),
});

export function CreateSpaceForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectUrl: "",
      authorName: user?.name || "",
      tags: ["SPACE"], // Default tag
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      timezone: user?.timezone || "",
    },
  });

  useEffect(() => {
    if (user?.name) {
      form.setValue('authorName', user.name);
      if (!form.getValues('projectUrl')) {
        const urlFriendlyName = user.name.replace(/\s+/g, '').replace(/[^\w-]/g, '');
        form.setValue('projectUrl', `https://x.com/${urlFriendlyName}`, { shouldValidate: true });
      }
    }
    if (user?.timezone) {
      form.setValue('timezone', user.timezone);
    }
  }, [user, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.name) {
        toast({ title: "Error", description: "You must be logged in to create a space.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    try {
      const { name, projectUrl, tags, daysOfWeek, startTime, endTime, timezone } = values;

      const creationPromises = daysOfWeek.map(day => {
          const spaceData: Omit<Space, 'id' | 'createdAt' | 'dateTime'> = {
              name,
              projectUrl,
              tags: tags,
              dayOfWeek: parseInt(day, 10),
              startTime,
              timezone,
              authorName: user.name!, // Always use the authenticated user's name
              createdBy: user.uid,   // Always use the authenticated user's UID
          };
          if (endTime) {
            spaceData.endTime = endTime;
          }
          return addSpace(spaceData);
      });

      await Promise.all(creationPromises);

      toast({
        title: "Space(s) Created!",
        description: `Your event(s) have been added to the weekly schedule.`,
      });
      router.push("/");
      
    } catch (error) {
      console.error("Failed to create space:", error);
      toast({
        title: "Creation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Space Name</FormLabel>
              <FormControl>
                <Input placeholder="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
            <FormLabel>Author</FormLabel>
            <p className="text-sm text-primary">{user?.name || "Loading..."}</p>
        </div>
         <FormField
          control={form.control}
          name="projectUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://x.com/yourproject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <div>
                <FormLabel>Tags</FormLabel>
                <FormDescription>
                  Select one or more tags that describe your event.
                </FormDescription>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Content Type</p>
                <div className="flex flex-wrap gap-4">
                  {eventTags.map((item) => (
                    <FormField
                      key={item.value}
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem
                          key={item.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.value])
                                  : field.onChange(
                                      (field.value || [])?.filter(
                                        (value) => value !== item.value
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Community Tags</p>
                <div className="flex flex-wrap gap-4">
                  {communityTags.map((item) => (
                    <FormField
                      key={item.value}
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem
                          key={item.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.value])
                                  : field.onChange(
                                      (field.value || [])?.filter(
                                        (value) => value !== item.value
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="daysOfWeek"
            render={() => (
                <FormItem>
                <div className="mb-4">
                    <FormLabel className="text-base">Day(s) of the Week</FormLabel>
                    <FormDescription>
                    Select one or more days for your recurring event.
                    </FormDescription>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {daysOfWeek.map((item) => (
                    <FormField
                        key={item.id}
                        control={form.control}
                        name="daysOfWeek"
                        render={({ field }) => {
                        return (
                            <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                            >
                            <FormControl>
                                <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                    return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        (field.value || [])?.filter(
                                        (value) => value !== item.id
                                        )
                                    )
                                }}
                                />
                            </FormControl>
                            <FormLabel className="font-normal">
                                {item.label}
                            </FormLabel>
                            </FormItem>
                        )
                        }}
                    />
                    ))}
                </div>
                <FormMessage />
                </FormItem>
            )}
            />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
         <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your city/timezone" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {cityTimezones.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        Select the city that best represents your timezone.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
            />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Space(s)"}
        </Button>
      </form>
    </Form>
  );
}

    