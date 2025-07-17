import { Header } from "@/components/header";
import { SpaceSchedule } from "@/components/space-schedule";
import { getSpaces } from "@/lib/data";

export default async function Home() {
  const spaces = await getSpaces();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8">
        <SpaceSchedule initialSpaces={spaces} />
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Créé pour la communauté ApeChain
      </footer>
    </div>
  );
}
