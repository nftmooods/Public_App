import { Header } from "@/components/header";
import { AddSpaceForm } from "@/components/admin/add-space-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Ajouter un nouvel Espace</CardTitle>
            <CardDescription>
              Remplissez le formulaire ci-dessous pour ajouter un nouvel Espace au programme. Toutes les heures doivent être saisies en UTC.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddSpaceForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
