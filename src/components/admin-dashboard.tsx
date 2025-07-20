
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSpaces, updateSpaceHostName } from '@/lib/firebase';
import type { Space } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';


export function AdminDashboard() {
    const { isSuperAdmin } = useAuth();
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // State for editable host names in the "All Events" tab
    const [editableHostNames, setEditableHostNames] = useState<Record<string, { name: string; isSaving: boolean }>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!isSuperAdmin) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const fetchedSpaces = await getSpaces();
                 // Ensure dateTime is a Date object if it's not already
                const spacesWithDates = fetchedSpaces.map(s => ({
                    ...s,
                    createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt)
                }));
                setSpaces(spacesWithDates as Space[]);
                
                // Initialize editable host names state
                const initialEditableState = (spacesWithDates as Space[]).reduce((acc, space) => {
                    acc[space.id] = { name: space.hostName || space.authorName || '', isSaving: false };
                    return acc;
                }, {} as Record<string, { name: string; isSaving: boolean }>);
                setEditableHostNames(initialEditableState);

            } catch (error) {
                console.error("Failed to fetch spaces:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSuperAdmin]);
    
    const uniqueHosts = useMemo(() => {
        const hostSet = new Set<string>();
        spaces.forEach(space => {
            if (space.hostName) hostSet.add(space.hostName);
            if (space.coHostName) hostSet.add(space.coHostName);
        });
        return Array.from(hostSet).sort((a, b) => a.localeCompare(b));
    }, [spaces]);

    const handleHostNameChange = (spaceId: string, newName: string) => {
        setEditableHostNames(prev => ({
            ...prev,
            [spaceId]: { ...prev[spaceId], name: newName }
        }));
    };

    const handleSaveHostName = async (spaceId: string) => {
        const originalSpace = spaces.find(s => s.id === spaceId);
        const { name: newHostName } = editableHostNames[spaceId];

        if (!originalSpace || !newHostName || (originalSpace.hostName || originalSpace.authorName) === newHostName) {
            return; // No change or invalid data
        }

        setEditableHostNames(prev => ({ ...prev, [spaceId]: { ...prev[spaceId], isSaving: true } }));

        try {
            await updateSpaceHostName(spaceId, newHostName);
            toast({ title: "Success", description: `Host name for "${originalSpace.name}" updated to "${newHostName}".` });
            
            // Update local state to reflect the change
            setSpaces(prevSpaces => prevSpaces.map(s => 
                s.id === spaceId ? { ...s, hostName: newHostName, authorName: newHostName } : s
            ));
        } catch (error) {
            console.error("Failed to update host name:", error);
            toast({ title: "Error", description: "Could not update host name.", variant: "destructive" });
            // Revert changes on error
            handleHostNameChange(spaceId, originalSpace.hostName || originalSpace.authorName || '');
        } finally {
            setEditableHostNames(prev => ({ ...prev, [spaceId]: { ...prev[spaceId], isSaving: false } }));
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!isSuperAdmin) {
        return null;
    }

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Super Admin Dashboard</CardTitle>
                <CardDescription>Manage hosts and events across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="events">
                    <TabsList>
                        <TabsTrigger value="members">Hosts & Co-hosts</TabsTrigger>
                        <TabsTrigger value="events">All Events</TabsTrigger>
                    </TabsList>
                    <TabsContent value="members">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right w-[120px]">Certified</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uniqueHosts.map((name) => (
                                    <TableRow key={name}>
                                        <TableCell className="font-medium">{name}</TableCell>
                                        <TableCell className="text-right">
                                           <Checkbox disabled />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="events">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event Name</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {spaces.map((space) => (
                                    <TableRow key={space.id}>
                                        <TableCell className="font-medium">{space.name}</TableCell>
                                        <TableCell>
                                            <Input 
                                                value={editableHostNames[space.id]?.name || ''}
                                                onChange={(e) => handleHostNameChange(space.id, e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>{format(space.createdAt, 'PP')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => handleSaveHostName(space.id)}
                                                disabled={editableHostNames[space.id]?.isSaving || editableHostNames[space.id]?.name === (space.hostName || space.authorName)}
                                            >
                                                {editableHostNames[space.id]?.isSaving ? 'Saving...' : 'Save'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
