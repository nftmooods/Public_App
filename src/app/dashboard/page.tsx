
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { DashboardForm } from '@/components/dashboard-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
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
        <Card className="w-full max-w-lg relative">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="absolute top-4 right-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">My Account</CardTitle>
            <CardDescription>
              Update your account settings below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
