import { Header } from "@/components/header";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthProvider } from "@/context/auth-context";

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthProvider>
  );
}
