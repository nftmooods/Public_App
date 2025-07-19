
import { Header } from "@/components/header";
import { SpaceSchedule } from "@/components/space-schedule";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8">
        {/* The SpaceSchedule component now fetches its own data */}
        <SpaceSchedule />
      </main>
      <footer className="py-6 text-center text-sm text-foreground/70">
        Created for the community by build&apos;ON&apos; more on{' '}
        <a 
            href="http://buildonapechain.xyz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-primary"
        >
            buildonapechain.xyz
        </a>
      </footer>
    </div>
  );
}
