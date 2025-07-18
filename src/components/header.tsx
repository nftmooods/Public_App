
"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { ApeIcon } from "./icons";
import { UserNav } from "./user-nav";
import { useAuth } from "@/context/auth-context";
import { Button } from "./ui/button";

export function Header() {
  const { user, loading } = useAuth();

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
        <div className="flex flex-1 items-center justify-end space-x-4">
            {user && !loading && (
              <Button asChild variant="outline" size="sm">
                <Link href="/create-space">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Space
                </Link>
              </Button>
            )}
            <UserNav />
        </div>
      </div>
    </header>
  );
}
