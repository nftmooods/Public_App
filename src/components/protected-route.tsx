
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for the loading state to resolve
    }

    if (!user) {
      router.push("/login");
    } else if (user.role !== 'admin') {
      // If user is not an admin, redirect them away from protected pages.
      router.push("/"); 
    }

  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    // You can render a loading spinner or a message
    return (
        <div className="flex flex-col justify-center items-center h-screen space-y-4">
            <p className="text-lg">Loading...</p>
            <p className="text-sm text-muted-foreground">Checking credentials...</p>
        </div>
    );
  }

  return <>{children}</>;
}
