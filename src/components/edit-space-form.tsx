
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateSpace, findUserByName } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { Space } from "@/lib/types";
import { deleteField } from "firebase/firestore";

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
  const { user, isAdmin } = useAuth(); // isAdmin is now SuperAdmin

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: space.name || "",
      projectUrl: space.projectUrl || "",
      authorName: space.authorName || "",
      tag: space.tag || "",
      dayOfWeek: String(space.dayOfWeek),
      startTime: space.startTime || "",
      endTime: space.endTime || "",
      timezone: space.timezone || "UTC",
    },
  });

  const canEditAuthor = isAdmin || user?.uid === space.createdBy;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to update a space.", variant: "destructive" });
        return;
    }
    // A standard user must be the creator to edit. A SuperAdmin can edit any space.
    if (!isAdmin && user.uid !== space.createdBy) {
         toast({ title: "Error", description: "You don't have permission to perform this action.", variant: "destructive" });
        return;
    }

    try {
      const { name, projectUrl, authorName, tag, dayOfWeek, startTime, endTime, timezone } = values;

      const spaceUpdateData: {[key:string]: any} = {
          name,
          projectUrl,
          tag: tag as "SPACE" | "STREAM" | "DISCORD VC",
          dayOfWeek: parseInt(dayOfWeek, 10),
          startTime,
          timezone,
          endTime: endTime ? endTime : deleteField(), // Use deleteField() to remove the field if empty
      };
      
      // The author can be changed IF the user is the current creator OR a super admin
      if (canEditAuthor && authorName !== space.authorName) {
        const author = await findUserByName(authorName);
        if (!author) {
            form.setError("authorName", {
                type: "manual",
                message: "This user could not be found. Please check the name.",
            });
            return;
        }
        spaceUpdateData.authorName = author.name;
        spaceUpdateData.createdBy = author.uid;
      } else if (authorName === space.authorName) {
        // No change, no need to update author fields
      } else {
        // This case should not be reached due to form field being disabled, but as a safeguard:
        toast({ title: "Error", description: "You do not have permission to change the author.", variant: "destructive" });
        return;
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
          name="authorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Enter author's name" {...field} disabled={!canEditAuthor} />
              </FormControl>
               <FormDescription>
                {isAdmin 
                    ? "As a SuperAdmin, you can re-assign this event." 
                    : canEditAuthor 
                        ? "You can transfer ownership by entering another user's name."
                        : "Only the current creator or a SuperAdmin can change the author."
                }
              </FormDescription>
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
