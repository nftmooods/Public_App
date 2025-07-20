
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSpaces } from '@/lib/firebase';
import type { Space } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HostDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const fetchHostData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const allSpaces = await getSpaces();
            // Filter spaces created by the current user
            const hostSpaces = allSpaces.filter(space => space.createdBy === user.uid);
            
            const spacesWithDates = hostSpaces.map(s => ({
                ...s,
                createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt)
            })) as Space[];

            const sortedSpaces = spacesWithDates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setSpaces(sortedSpaces);

        } catch (error) {
            console.error("Failed to fetch host data:", error);
            toast({ title: "Error", description: "Could not fetch your events.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading) {
            fetchHostData();
        }
    }, [authLoading, fetchHostData]);
    
    const filteredSpaces = useMemo(() => {
        if (!searchQuery) return spaces;
        const lowercasedQuery = searchQuery.toLowerCase();
        return spaces.filter(space =>
            space.name.toLowerCase().includes(lowercasedQuery) ||
            (space.coHostName && space.coHostName.toLowerCase().includes(lowercasedQuery))
        );
    }, [spaces, searchQuery]);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    if (loading || authLoading) {
        return (
            <div className="w-full max-w-6xl space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    return (
        <Card className="w-full relative">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="absolute top-4 right-4 z-10"
             >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Host Dashboard</CardTitle>
                <CardDescription>Manage your created events.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4">
                    <Input
                        placeholder="Search your events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-sm"
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Day</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSpaces.map((space) => (
                            <TableRow key={space.id}>
                                <TableCell className="font-medium">{space.name}</TableCell>
                                <TableCell>{dayNames[space.dayOfWeek]}</TableCell>
                                <TableCell>{space.startTime}</TableCell>
                                <TableCell>
                                    <Badge variant={space.isActive === false ? 'destructive' : 'secondary'}>
                                        {space.isActive === false ? 'Inactive' : 'Active'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/edit-space/${space.id}`)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {filteredSpaces.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    You have not created any events yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
