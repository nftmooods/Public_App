
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateSpace } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { Space } from "@/lib/types";

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
  tag: z.string().min(1, { message: "Please select a tag." }),
  dayOfWeek: z.string().min(1, { message: "Please select a day." }),
  startTime: z.string().min(1, { message: "Please select a start time." }),
  endTime: z.string().optional(),
  timezone: z.string().min(1, { message: "Please select a timezone." }),
});

interface EditSpaceFormProps {
    space: Omit<Space, 'dateTime'>;
}

export function EditSpaceForm({ space }: EditSpaceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: space.name || "",
      projectUrl: space.projectUrl || "",
      tag: space.tag || "",
      dayOfWeek: String(space.dayOfWeek),
      startTime: space.startTime || "",
      endTime: space.endTime || "",
      timezone: space.timezone || "UTC",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || user.uid !== space.createdBy) {
        toast({ title: "Error", description: "You don't have permission to perform this action.", variant: "destructive" });
        return;
    }

    try {
      const { name, projectUrl, tag, dayOfWeek, startTime, endTime, timezone } = values;

      const spaceUpdateData: Partial<Omit<Space, 'id' | 'createdAt' | 'dateTime'>> = {
          name,
          projectUrl,
          tag: tag as "SPACE" | "STREAM" | "DISCORD VC",
          dayOfWeek: parseInt(dayOfWeek, 10),
          startTime,
          timezone,
          authorName: user.name || "Anonymous", // Keep author name consistent
          createdBy: user.uid,
      };

      if (endTime) {
        spaceUpdateData.endTime = endTime;
      } else {
        spaceUpdateData.endTime = undefined; // Or handle as needed in Firestore
      }

      await updateSpace(space.id, spaceUpdateData);

      toast({
        title: "Space Updated!",
        description: `Your event has been successfully updated.`,
      });
      router.push("/");
      
    } catch (error) {
      console.error("Failed to update space:", error);
      toast({
        title: "Update Failed",
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
            name="dayOfWeek"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Day of the Week</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {daysOfWeek.map(day => (
                        <SelectItem key={day.id} value={day.id}>{day.label}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
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
            {form.formState.isSubmitting ? "Updating..." : "Update Space"}
        </Button>
      </form>
    </Form>
  );
}
