
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useMemo } from 'react';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

const contentPlaceTags = [
    { value: "SPACE", label: "SPACE" },
    { value: "STREAM", label: "STREAM" },
    { value: "DISCORD VC", label: "DISCORD VC" },
];

const contentTypeTags = [
    { id: "ApeChain", label: "ApeChain" },
    { id: "NFT", label: "NFT" },
    { id: "DeFi", label: "DeFi" },
    { id: "Gaming", label: "Gaming" },
    { id: "Art", label: "Art" },
    { id: "Music", label: "Music" },
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
  authorName: z.string().min(2, { message: "Author name is required." }),
  coHostName: z.string().optional(),
  projectUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  contentPlace: z.string({ required_error: "You must select a content place." }),
  contentType: z.array(z.string())
    .refine((value) => value.length >= 1, { message: "You have to select at least one content type." })
    .refine((value) => value.length <= 2, { message: "You can select a maximum of two content types." }),
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
  const { user, isSuperAdmin } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { initialContentPlace, initialContentType } = useMemo(() => {
    const contentPlaceValues = contentPlaceTags.map(t => t.value);
    const contentTypeValues = contentTypeTags.map(t => t.id);
    
    const tags = space.tags || [];

    const initialContentPlace = tags.find(tag => contentPlaceValues.includes(tag)) || "SPACE";
    
    let initialContentType = tags.filter(tag => contentTypeValues.includes(tag));
    if (initialContentType.length === 0) {
      initialContentType = ["ApeChain"]; // Default if none found
    }

    return { initialContentPlace, initialContentType };
  }, [space.tags]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: space.name || "",
      authorName: space.authorName || "",
      coHostName: space.coHostName || "",
      projectUrl: space.projectUrl || "",
      contentPlace: initialContentPlace,
      contentType: initialContentType,
      dayOfWeek: String(space.dayOfWeek),
      startTime: space.startTime || "",
      endTime: space.endTime || "",
      timezone: space.timezone || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to update a moment.", variant: "destructive" });
        return;
    }

    if (!isSuperAdmin && user.uid !== space.createdBy) {
         toast({ title: "Permission Denied", description: "You can only edit events that you have created.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    try {
      const { name, authorName, coHostName, projectUrl, dayOfWeek, startTime, endTime, timezone, contentPlace, contentType } = values;
      const tags = [contentPlace, ...contentType];

      const spaceUpdateData: {[key:string]: any} = {
          name,
          tags: tags,
          dayOfWeek: parseInt(dayOfWeek, 10),
          startTime,
          timezone,
          projectUrl: projectUrl ? projectUrl : deleteField(),
          endTime: endTime ? endTime : deleteField(),
          coHostName: coHostName ? coHostName : deleteField(),
      };
      
      if (isSuperAdmin) {
          spaceUpdateData.authorName = authorName;
      }

      await updateSpace(space.id, spaceUpdateData);

      toast({
        title: "Moment Updated!",
        description: `Your event has been successfully updated.`,
      });
      router.push("/");
      
    } catch (error) {
      console.error("Failed to update moment:", error);
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
        title: "Moment Deleted",
        description: "The event has been permanently removed.",
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to delete moment:", error);
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
              <FormLabel>Moment Name</FormLabel>
              <FormControl>
                <Input placeholder="Community Weekly Update" {...field} />
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
                  <Input {...field} disabled={!isSuperAdmin} />
              </FormControl>
              <FormDescription>
                {isSuperAdmin ? "You can change the author name." : "The author of an event cannot be changed."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coHostName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Co-host Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Another community member" {...field} />
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
              <FormLabel>URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://x.com/yourproject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
            <FormField
              control={form.control}
              name="contentPlace"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Content Place</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      {contentPlaceTags.map((tag) => (
                        <FormItem key={tag.value} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={tag.value} />
                          </FormControl>
                          <FormLabel className="font-normal">{tag.label}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentType"
              render={() => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {contentTypeTags.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="contentType"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter(
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
        </div>
        
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
                    Delete Moment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this moment
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
                {isSubmitting ? "Updating..." : "Update Moment"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
