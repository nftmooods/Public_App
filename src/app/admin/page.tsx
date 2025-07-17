import { Header } from "@/components/header";
import { AddSpaceForm } from "@/components/admin/add-space-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthProvider } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";

export default function AdminPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Add a new Space</CardTitle>
                <CardDescription>
                  Fill out the form below to add a new Space to the schedule. All times should be entered in UTC.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddSpaceForm />
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
