
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { EditSpaceForm } from '@/components/edit-space-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getSpace } from '@/lib/firebase';
import type { Space } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditSpacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const spaceId = params.id as string;

  const [space, setSpace] = useState<Omit<Space, 'dateTime'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be resolved

    if (!user) {
      router.replace('/login');
      return;
    }

    if (spaceId && user) {
      const fetchSpaceData = async () => {
        try {
          setLoading(true);
          const spaceData = await getSpace(spaceId);
          if (!spaceData) {
            setError("The requested space could not be found.");
            return;
          }
          if (spaceData.createdBy !== user.uid) {
            setError("You do not have permission to edit this space.");
            // Optionally redirect
            // router.replace('/');
            return;
          }
          setSpace(spaceData);
        } catch (err) {
          setError("An error occurred while fetching space details.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSpaceData();
    }
  }, [spaceId, user, authLoading, router]);

  const renderContent = () => {
    if (loading || authLoading) {
      return (
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }

    if (error) {
       return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </CardContent>
        </Card>
       )
    }

    if (space) {
        return (
             <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Edit your Space</CardTitle>
                    <CardDescription>
                    Update the details for your event below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditSpaceForm space={space} />
                </CardContent>
            </Card>
        )
    }

    return null; // Should not be reached if logic is correct
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8 flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
}
