
"use client";

import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";


export function UserNav() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in AuthProvider will handle the redirect.
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <Button variant="ghost" size="sm">Loading...</Button>;
  }

  if (!user) {
    return (
        <Button asChild>
            <Link href="/login">Login</Link>
        </Button>
    );
  }
  
  const getInitials = (name: string | null) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length === 0) return '';
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={undefined} alt={user.name || "User"} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
