"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting you to the homepage.",
      });

      router.push('/'); 

    } catch (error) {
      console.error("Login Error:", error);
      toast({
        title: "Login Failed",
        description: "The email or password you entered is incorrect.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex w-full flex-col justify-center space-y-6">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                  <Input placeholder="name@example.com" {...field} />
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
                  <Input type="password" placeholder="Your password" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Logging in..." : "Login"}
          </Button>
          </form>
      </Form>
      <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
          >
          Don't have an account? Sign Up
          </Link>
      </p>
    </div>
  );
}
