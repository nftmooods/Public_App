
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
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function EditSpacePage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const spaceId = params.id as string;

  const [space, setSpace] = useState<Omit<Space, 'dateTime'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const spaceData = await getSpace(spaceId);
        
        if (!spaceData) {
          setError("The requested moment could not be found.");
          return;
        }

        // Extended permission check
        const isCreator = spaceData.createdBy === user.uid;
        const isCoHost = spaceData.coHostName && spaceData.coHostName === user.name;
        
        if (!isSuperAdmin && !isCreator && !isCoHost) {
          setError("You do not have permission to edit this moment.");
          return;
        }

        setSpace(spaceData);

      } catch (err) {
        setError("An error occurred while fetching moment details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();

  }, [spaceId, user, authLoading, isSuperAdmin, router]);

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
                    <CardTitle className="font-headline text-2xl">Edit your Moment</CardTitle>
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
