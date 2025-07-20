
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSpaces, updateSpaceHostName, updateSpaceAuthorName, getAllUsers, updateUserRoles } from '@/lib/firebase';
import type { Space, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type EditableNameState = {
    name: string;
    isSaving: boolean;
};

type EditableNames = {
    authorName: EditableNameState;
    hostName: EditableNameState;
};

type EditableRoles = Record<string, { isHost: boolean; isSuperAdmin: boolean; isCertified: boolean; }>;


export function AdminDashboard() {
    const { isSuperAdmin } = useAuth();
    const router = useRouter();
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const [editableNames, setEditableNames] = useState<Record<string, EditableNames>>({});
    const [editableRoles, setEditableRoles] = useState<EditableRoles>({});
    const [isSavingRoles, setIsSavingRoles] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isSuperAdmin) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [fetchedSpaces, fetchedUsers] = await Promise.all([
                getSpaces(),
                getAllUsers()
            ]);

            const spacesWithDates = fetchedSpaces.map(s => ({
                ...s,
                createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt)
            })) as Space[];
            setSpaces(spacesWithDates);
            setUsers(fetchedUsers);
            
            const initialEditableState = spacesWithDates.reduce((acc, space) => {
                acc[space.id] = {
                    authorName: { name: space.authorName || '', isSaving: false },
                    hostName: { name: space.hostName || '', isSaving: false },
                };
                return acc;
            }, {} as Record<string, EditableNames>);
            setEditableNames(initialEditableState);

             const initialRolesState = fetchedUsers.reduce((acc, user) => {
                acc[user.uid] = { 
                    isHost: user.isHost, 
                    isSuperAdmin: user.isSuperAdmin,
                    isCertified: user.isCertified || false,
                };
                return acc;
            }, {} as EditableRoles);
            setEditableRoles(initialRolesState);


        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            toast({ title: "Error", description: "Could not fetch admin data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin, toast]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    
    const handleRoleChange = (userId: string, role: 'isHost' | 'isSuperAdmin' | 'isCertified', value: boolean) => {
        setEditableRoles(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [role]: value }
        }));
    };

    const handleSaveRoles = async () => {
        setIsSavingRoles(true);
        const promises = users.map(user => {
            const originalRoles = { 
                isHost: user.isHost, 
                isSuperAdmin: user.isSuperAdmin,
                isCertified: user.isCertified || false,
            };
            const newRoles = editableRoles[user.uid];
            if (originalRoles.isHost !== newRoles.isHost || originalRoles.isSuperAdmin !== newRoles.isSuperAdmin || originalRoles.isCertified !== newRoles.isCertified) {
                return updateUserRoles(user.uid, { 
                    host: newRoles.isHost, 
                    SuperAdmin: newRoles.isSuperAdmin,
                    isCertified: newRoles.isCertified
                });
            }
            return Promise.resolve();
        });

        try {
            await Promise.all(promises);
            toast({ title: "Success", description: "User roles have been updated." });
            await fetchData(); // Re-fetch data to confirm changes
        } catch (error) {
            console.error("Failed to save roles:", error);
            toast({ title: "Error", description: "Could not save user roles.", variant: "destructive" });
        } finally {
            setIsSavingRoles(false);
        }
    };


    const handleNameChange = (spaceId: string, field: 'authorName' | 'hostName', newName: string) => {
        setEditableNames(prev => ({
            ...prev,
            [spaceId]: {
                ...prev[spaceId],
                [field]: { ...prev[spaceId][field], name: newName }
            }
        }));
    };

    const copyAuthorToHost = (spaceId: string) => {
        const authorName = editableNames[spaceId]?.authorName?.name;
        if (authorName) {
            handleNameChange(spaceId, 'hostName', authorName);
        }
    };

    const copyHostToAuthor = (spaceId: string) => {
        const hostName = editableNames[spaceId]?.hostName?.name;
        if (hostName) {
            handleNameChange(spaceId, 'authorName', hostName);
        }
    };

    const handleSaveName = async (spaceId: string, field: 'authorName' | 'hostName') => {
        const originalSpace = spaces.find(s => s.id === spaceId);
        const { name: newName } = editableNames[spaceId][field];
        const originalName = originalSpace ? originalSpace[field] : '';

        if (!originalSpace || !newName || originalName === newName) {
            return; // No change or invalid data
        }

        setEditableNames(prev => ({ 
            ...prev, 
            [spaceId]: { ...prev[spaceId], [field]: { ...prev[spaceId][field], isSaving: true } } 
        }));

        try {
            if (field === 'authorName') {
                await updateSpaceAuthorName(spaceId, newName);
            } else {
                await updateSpaceHostName(spaceId, newName);
            }

            toast({ title: "Success", description: `${field} for "${originalSpace.name}" updated to "${newName}".` });
            
            // Update local state to reflect the change
            setSpaces(prevSpaces => prevSpaces.map(s => 
                s.id === spaceId ? { ...s, [field]: newName } : s
            ));
        } catch (error) {
            console.error(`Failed to update ${field}:`, error);
            toast({ title: "Error", description: `Could not update ${field}.`, variant: "destructive" });
            // Revert changes on error
            handleNameChange(spaceId, field, originalName || '');
        } finally {
             setEditableNames(prev => ({ 
                ...prev, 
                [spaceId]: { ...prev[spaceId], [field]: { ...prev[spaceId][field], isSaving: false } } 
            }));
        }
    };
    
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        return users.filter(user =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const filteredSpaces = useMemo(() => {
        if (!searchQuery) return spaces;
        const lowercasedQuery = searchQuery.toLowerCase();
        return spaces.filter(space =>
            space.name.toLowerCase().includes(lowercasedQuery) ||
            (space.authorName && space.authorName.toLowerCase().includes(lowercasedQuery)) ||
            (space.hostName && space.hostName.toLowerCase().includes(lowercasedQuery))
        );
    }, [spaces, searchQuery]);


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
                <CardTitle className="font-headline text-2xl">Super Admin Dashboard</CardTitle>
                <CardDescription>Manage authors and events across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="events">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="members">Authors</TabsTrigger>
                            <TabsTrigger value="events">All Events</TabsTrigger>
                        </TabsList>
                         <Input
                            placeholder="Search authors or events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-sm"
                        />
                    </div>
                    <TabsContent value="members">
                         <div className="flex justify-end mb-4">
                            <Button onClick={handleSaveRoles} disabled={isSavingRoles}>
                                {isSavingRoles ? 'Saving...' : 'Save All Role Changes'}
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Author</TableHead>
                                    <TableHead className="w-[100px] text-center">Host</TableHead>
                                    <TableHead className="w-[100px] text-center">Super Admin</TableHead>
                                    <TableHead className="w-[100px] text-center">Certified</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">
                                            <div>{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={editableRoles[user.uid]?.isHost ?? false}
                                                onCheckedChange={(checked) => handleRoleChange(user.uid, 'isHost', !!checked)}
                                                aria-label={`Set host status for ${user.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={editableRoles[user.uid]?.isSuperAdmin ?? false}
                                                onCheckedChange={(checked) => handleRoleChange(user.uid, 'isSuperAdmin', !!checked)}
                                                aria-label={`Set super admin for ${user.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={editableRoles[user.uid]?.isCertified ?? false}
                                                onCheckedChange={(checked) => handleRoleChange(user.uid, 'isCertified', !!checked)}
                                                aria-label={`Set certified status for ${user.name}`}
                                            />
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
                                    <TableHead className="w-[40px] p-0"></TableHead>
                                    <TableHead>Host</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right w-[220px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSpaces.map((space) => {
                                    const authorState = editableNames[space.id]?.authorName;
                                    const hostState = editableNames[space.id]?.hostName;
                                    const namesAreDifferent = authorState?.name !== hostState?.name;

                                    return (
                                        <TableRow key={space.id}>
                                            <TableCell className="font-medium">{space.name}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    value={authorState?.name || ''}
                                                    onChange={(e) => handleNameChange(space.id, 'authorName', e.target.value)}
                                                    className={cn(
                                                        "h-8",
                                                        namesAreDifferent && "bg-muted border-foreground/30"
                                                    )}
                                                    disabled={authorState?.isSaving || hostState?.isSaving}
                                                />
                                            </TableCell>
                                            <TableCell className="px-1 align-middle">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Button 
                                                        variant="ghost"
                                                        size="icon" 
                                                        className="h-6 w-6"
                                                        onClick={() => copyAuthorToHost(space.id)}
                                                        disabled={authorState?.isSaving || hostState?.isSaving}
                                                        title="Copy Author to Host"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost"
                                                        size="icon" 
                                                        className="h-6 w-6"
                                                        onClick={() => copyHostToAuthor(space.id)}
                                                        disabled={authorState?.isSaving || hostState?.isSaving}
                                                        title="Copy Host to Author"
                                                    >
                                                        <ArrowLeft className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                             <TableCell>
                                                <Input 
                                                    value={hostState?.name || ''}
                                                    onChange={(e) => handleNameChange(space.id, 'hostName', e.target.value)}
                                                    className={cn(
                                                        "h-8",
                                                        namesAreDifferent && "bg-muted border-foreground/30"
                                                    )}
                                                    disabled={authorState?.isSaving || hostState?.isSaving}
                                                />
                                            </TableCell>
                                            <TableCell>{format(space.createdAt, 'PP')}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveName(space.id, 'authorName')}
                                                    disabled={authorState?.isSaving || authorState?.name === space.authorName}
                                                >
                                                    {authorState?.isSaving ? 'Saving...' : 'Save Author'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveName(space.id, 'hostName')}
                                                    disabled={hostState?.isSaving || hostState?.name === space.hostName}
                                                >
                                                    {hostState?.isSaving ? 'Saving...' : 'Save Host'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
