
import { Header } from "@/components/header";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md relative">
           <Button asChild variant="ghost" size="sm" className="absolute top-4 right-4">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
