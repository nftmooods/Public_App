import { Header } from "@/components/header";
import { SpaceSchedule } from "@/components/space-schedule";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8">
        {/* Le composant SpaceSchedule récupère maintenant ses propres données */}
        <SpaceSchedule />
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Created for the ApeChain community
      </footer>
    </div>
  );
}
