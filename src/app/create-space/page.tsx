
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { CreateSpaceForm } from '@/components/create-space-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreateSpacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="w-full max-w-lg space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-96 w-full" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create a new Space</CardTitle>
            <CardDescription>
              Fill out the details below to add your event to the schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateSpaceForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
