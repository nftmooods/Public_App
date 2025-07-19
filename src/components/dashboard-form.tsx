
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { updateEmail } from "firebase/auth";


import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
});

export function DashboardForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, forceReload } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !auth.currentUser) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }

    const { name, email } = values;
    const promises = [];
    let profileUpdated = false;
    let emailUpdated = false;

    // --- Update Name ---
    if (name !== user.name) {
        promises.push(updateUserProfile(user.uid, { name }));
        profileUpdated = true;
    }

    // --- Update Email ---
    if (email !== user.email) {
       promises.push(updateEmail(auth.currentUser, email));
       emailUpdated = true;
    }
    
    if (promises.length === 0) {
        toast({ title: "No Changes", description: "You haven't made any changes to your profile." });
        return;
    }

    try {
      await Promise.all(promises);
      
      toast({
        title: "Profile Updated!",
        description: `Your account details have been successfully updated.`,
      });

      // Force a refresh of the user token and context state
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
        
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
