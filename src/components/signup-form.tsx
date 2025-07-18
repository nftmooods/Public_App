"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, createUserProfileDocument } from "@/lib/firebase";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { name, email, password } = values;
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with their name in Firebase Auth
      await updateProfile(user, { displayName: name });

      // Create a user document in Firestore to store additional details
      await createUserProfileDocument(user, { name });

      toast({
        title: "Account Created!",
        description: "You have been successfully signed up.",
      });
      router.push("/");
    } catch (error: any) {
        let description = "An unexpected error occurred. Please check your details and try again.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already in use. Please try another one.";
        } else if (error.code === 'auth/weak-password') {
            description = "The password is too weak. Please choose a stronger password.";
        } else if (error.code === 'auth/invalid-email') {
            description = "The email address is not valid.";
        }
        console.error("Signup Error:", error);
      toast({
        title: "Sign up failed",
        description: description,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Ape Investor" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="ape@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating account..." : "Sign Up"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-primary">
                Login
            </Link>
        </div>
      </form>
    </Form>
  );
}
