
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

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // Redirect to home if authenticated but not an admin
    if (user.role !== 'admin') {
      router.push("/"); 
    }

  }, [user, loading, router]);

  // While loading, or if the user is not an admin, show a loading/redirecting message.
  if (loading || !user || user.role !== 'admin') {
    return (
        <div className="flex flex-col justify-center items-center h-screen space-y-4">
            <p className="text-lg">Loading...</p>
            <p className="text-sm text-muted-foreground">Verifying access rights...</p>
        </div>
    );
  }

  // If the user is an admin, render the protected content.
  return <>{children}</>;
}
