import { Header } from "@/components/header";
import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthProvider } from "@/context/auth-context";

export default function SignupPage() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
              <CardDescription>
                Enter your details below to create your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignupForm />
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthProvider>
  );
}
