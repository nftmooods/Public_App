
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateEmail } from "firebase/auth";
import { Trash2Icon } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile, deleteUserAccount, updateUserSpacesAuthorName } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
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
import { timezones as cityTimezones } from "@/lib/timezones";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  timezone: z.string().optional(),
});

export function DashboardForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, forceReload } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      timezone: user?.timezone || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        timezone: user.timezone || "",
      });
    }
  }, [user, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !auth.currentUser) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const { name, email, timezone } = values;
    const promises = [];
    let nameChanged = false;
    
    const updates: { name?: string; timezone?: string } = {};

    // --- Update Name ---
    if (name !== user.name) {
        updates.name = name;
        nameChanged = true;
    }
    
    // --- Update Timezone ---
    if (timezone !== user.timezone) {
      updates.timezone = timezone;
    }
    
    // --- Update Email ---
    if (email !== user.email) {
       promises.push(updateEmail(auth.currentUser, email));
    }
    
    // --- Update Firestore Profile ---
    if (Object.keys(updates).length > 0) {
        promises.push(updateUserProfile(user.uid, updates));
    }
    
    if (promises.length === 0 && !nameChanged && timezone === user.timezone) {
        toast({ title: "No Changes", description: "You haven't made any changes to your profile." });
        setIsSaving(false);
        return;
    }

    try {
      await Promise.all(promises);

      if (nameChanged) {
          await updateUserSpacesAuthorName(user.uid, name);
      }
      
      toast({
        title: "Profile Updated!",
        description: `Your account details have been successfully updated.`,
      });

      await forceReload();
      
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
          errorMessage = "This is a sensitive operation. Please log out and log back in before changing your email."
      } else if (error.code === 'auth/email-already-in-use') {
          errorMessage = "This email is already registered to another account."
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
    }
  }

   async function handleDeleteAccount() {
    if (!user) return;
    try {
      await deleteUserAccount();
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      router.push('/'); // Redirect to home page after deletion
    } catch (error: any) {
      console.error("Failed to delete account:", error);
       let errorMessage = "An unexpected error occurred. Please try again.";
       if (error.code === 'auth/requires-recent-login') {
          errorMessage = "This is a sensitive operation. Please log out and log back in before deleting your account."
      }
      toast({
        title: "Deletion Failed",
        description: errorMessage,
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
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Your Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
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
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <Button type="submit" className="w-full" disabled={isSaving || !form.formState.isDirty}>
            {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
       <div className="mt-8 border-t border-destructive/20 pt-6">
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This action cannot be undone. This will permanently delete your account and all associated data.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4 w-full sm:w-auto">
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account,
                your profile information, and any spaces you have created. Are you sure you
                want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Form>
  );
}
