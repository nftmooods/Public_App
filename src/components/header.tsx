import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApeIcon } from "./icons";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ApeIcon className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline sm:inline-block">
              ApeChain Spaces
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Button asChild variant="ghost">
              <Link href="/admin">Admin</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
