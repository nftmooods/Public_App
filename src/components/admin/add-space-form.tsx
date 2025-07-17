"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
// Import from firebase instead of actions
import { addSpace } from "@/lib/firebase"; 
import { useAuth } from "@/context/auth-context";

const formSchema = z.object({
  name: z.string().min(3, { message: "Space name must be at least 3 characters." }),
  projectUrl: z.string().url({ message: "Please enter a valid URL." }),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Please enter a valid time in HH:MM format." }),
});

export function AddSpaceForm() {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectUrl: "",
      time: "18:00",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Check for user and user.uid
    if (!user || !user.uid) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to add a space.",
            variant: "destructive",
        });
        return;
    }

    const [hours, minutes] = values.time.split(":").map(Number);
    const combinedDateTime = new Date(values.date);
    combinedDateTime.setUTCHours(hours, minutes, 0, 0);

    try {
        // Call the new addSpace function from firebase.ts with the correct data structure
        await addSpace({
            name: values.name,
            projectUrl: values.projectUrl,
            dateTime: combinedDateTime, // The JS Date object will be converted to a Firestore Timestamp
            createdBy: user.uid, // Use user's UID for security rules
            authorName: user.name || "Unknown", // Keep author's name for display
            createdAt: new Date(), // Add a server-side timestamp for creation
        });
        toast({
            title: "Space added!",
            description: "The new Space has been successfully added to the schedule.",
        });
        form.reset();
    } catch (error) {
        console.error("Error adding space: ", error);
        toast({
            title: "Error",
            description: "Failed to add the new Space. This could be a permissions issue. Please try again.",
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
                <Input placeholder="ApeChain Community Call" {...field} />
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
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Date (UTC)</FormLabel>
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
                                format(field.value, "PPP", { locale: enUS })
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            locale={enUS}
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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
                <FormLabel>Time (UTC 24hr)</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !user}>
            {form.formState.isSubmitting ? "Adding..." : "Add Space"}
        </Button>
      </form>
    </Form>
  );
}
