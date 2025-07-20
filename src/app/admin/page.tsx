
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { AdminDashboard } from '@/components/admin-dashboard';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';


export default function AdminPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  const hasAccess = isSuperAdmin;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  const renderContent = () => {
    if (loading || !user) {
        return (
            <div className="w-full max-w-6xl space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    if (!hasAccess) {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Permission Required</AlertTitle>
                        <AlertDescription>
                            You do not have the necessary permissions to view this page.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-6xl relative">
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="absolute top-4 right-4"
             >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <AdminDashboard />
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 py-8">
        <div className="flex justify-center">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}
