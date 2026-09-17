
import { Header } from "@/components/header";
import { SpaceSchedule } from "@/components/space-schedule";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 overflow-hidden">
        <SpaceSchedule />
      </div>
      <footer className="py-4 text-center text-sm text-foreground/70 border-t">
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
