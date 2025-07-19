
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { addSpace, findUserByName } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { Space } from '@/lib/types';
import { useEffect } from "react";


const timezones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "EST (New York)" },
    { value: "America/Chicago", label: "CST (Chicago)" },
    { value: "America/Denver", label: "MST (Denver)" },
    { value: "America/Los_Angeles", label: "PST (Los Angeles)" },
    { value: "Europe/London", label: "GMT (London)" },
    { value: "Europe/Paris", label: "CET (Paris)" },
    { value: "Asia/Tokyo", label: "JST (Tokyo)" },
];

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
  authorName: z.string().min(2, { message: "Author name must be at least 2 characters." }),
  tag: z.string().min(1, { message: "Please select a tag." }),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectUrl: "",
      authorName: user?.name || "",
      tag: "SPACE",
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      timezone: "UTC",
    },
  });

  // Update default values when user context loads or authorName changes
  useEffect(() => {
    if (user && !form.getValues('authorName')) {
      form.setValue('authorName', user.name || "");
    }
    const authorName = form.watch('authorName');
    if(authorName) {
        // Sanitize name for URL: remove spaces and special characters
        const urlFriendlyName = authorName.replace(/\s+/g, '').replace(/[^\w-]/g, '');
        if (!form.getValues('projectUrl') || form.formState.isDirty('authorName')) {
             form.setValue('projectUrl', `https://x.com/${urlFriendlyName}`, { shouldValidate: true });
        }
    }
  }, [user, form.watch('authorName'), form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to create a space.", variant: "destructive" });
        return;
    }

    try {
      const { name, projectUrl, authorName, tag, daysOfWeek, startTime, endTime, timezone } = values;

      const author = await findUserByName(authorName);
      if (!author) {
          form.setError("authorName", {
              type: "manual",
              message: "This user could not be found. Please check the name.",
          });
          return;
      }

      const creationPromises = daysOfWeek.map(day => {
          const spaceData: Omit<Space, 'id' | 'createdAt' | 'dateTime'> = {
              name,
              projectUrl,
              tag: tag as "SPACE" | "STREAM" | "DISCORD VC",
              dayOfWeek: parseInt(day, 10),
              startTime,
              timezone,
              authorName: author.name, // Use the name from the found user document
              createdBy: author.uid, // Assign ownership to the found user
          };
          if (endTime) {
            spaceData.endTime = endTime;
          }
          return addSpace(spaceData);
      });

      await Promise.all(creationPromises);

      toast({
        title: "Space(s) Created!",
        description: `Your event(s) have been added to the weekly schedule for the selected days.`,
      });
      router.push("/");
      
    } catch (error) {
      console.error("Failed to create space:", error);
      toast({
        title: "Creation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
                <Input placeholder="ApeChain Weekly Update" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="authorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Enter author's name" {...field} />
              </FormControl>
               <FormDescription>
                The name of the user hosting this event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                  <SelectTrigger>
                      <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                  {eventTags.map(tag => (
                      <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>
                  ))}
                  </SelectContent>
              </Select>
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
                        <SelectValue placeholder="Select the timezone for the time you entered" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {timezones.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Space(s)"}
        </Button>
      </form>
    </Form>
  );
}
