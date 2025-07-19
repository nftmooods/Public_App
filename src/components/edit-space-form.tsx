
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from 'react';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { updateSpace, deleteSpace } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { Space } from "@/lib/types";
import { deleteField } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2Icon } from "lucide-react";
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
  authorName: z.string(), // Is now read-only
  tags: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one tag.",
  }),
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: space.name || "",
      projectUrl: space.projectUrl || "",
      authorName: space.authorName || "",
      tags: space.tags || [],
      dayOfWeek: String(space.dayOfWeek),
      startTime: space.startTime || "",
      endTime: space.endTime || "",
      timezone: space.timezone || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to update a space.", variant: "destructive" });
        return;
    }

    if (user.uid !== space.createdBy) {
         toast({ title: "Permission Denied", description: "You can only edit events that you have created.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    try {
      const { name, projectUrl, tags, dayOfWeek, startTime, endTime, timezone } = values;

      const spaceUpdateData: {[key:string]: any} = {
          name,
          projectUrl,
          tags: tags,
          dayOfWeek: parseInt(dayOfWeek, 10),
          startTime,
          timezone,
          endTime: endTime ? endTime : deleteField(), 
      };

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
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteSpace(space.id);
      toast({
        title: "Space Deleted",
        description: "The event has been permanently removed.",
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to delete space:", error);
      toast({
        title: "Deletion Failed",
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
          name="authorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
               <FormDescription>
                The author of an event cannot be changed.
              </FormDescription>
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
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="w-full sm:w-auto" disabled={isSubmitting}>
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Delete Space
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this space
                    from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" className="w-full sm:w-auto mb-2 sm:mb-0" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Space"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    