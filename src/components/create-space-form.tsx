
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';


import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { addSpace } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

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

const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  projectUrl: z.string().url({ message: "Please enter a valid URL." }),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Please enter a valid time (HH:MM)." }),
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
      time: "",
      timezone: "UTC",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to create a space.", variant: "destructive" });
        return;
    }

    try {
      const { name, projectUrl, date, time, timezone } = values;
      const [hours, minutes] = time.split(':').map(Number);
      
      // Set hours and minutes on the selected date
      date.setHours(hours, minutes, 0, 0);

      // Convert the local date to a zoned time, then get the final UTC Date object for Firestore
      const dateInTz = toZonedTime(date, timezone);
      
      const spaceData = {
          name,
          projectUrl,
          dateTime: dateInTz, // Pass the final Date object
          authorName: user.name || "Anonymous",
          createdBy: user.uid,
      };

      await addSpace(spaceData as any);

      toast({
        title: "Space Created!",
        description: "Your event has been added to the schedule.",
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
          name="projectUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project URL</FormLabel>
              <FormControl>
                <Input placeholder="https://x.com/yourproject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
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
                <FormLabel>Timezone of Input</FormLabel>
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
                 <FormDescription>Select the timezone in which you entered the time above.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Space"}
        </Button>
      </form>
    </Form>
  );
}
