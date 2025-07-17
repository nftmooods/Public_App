import { Header } from "@/components/header";
import { getSpaces } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthProvider } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";

export default async function ConsolePage() {
  const spaces = await getSpaces();

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="flex-1 w-full container mx-auto px-4 py-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Data Console</CardTitle>
                <CardDescription>
                  A view of all the Spaces currently stored in the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Project URL</TableHead>
                      <TableHead>Date & Time (UTC)</TableHead>
                      <TableHead>Author</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spaces.map((space) => (
                      <TableRow key={space.id}>
                        <TableCell className="font-medium">{space.name}</TableCell>
                        <TableCell>{space.projectUrl}</TableCell>
                        <TableCell>{new Date(space.dateTime).toUTCString()}</TableCell>
                        <TableCell>{space.author}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
