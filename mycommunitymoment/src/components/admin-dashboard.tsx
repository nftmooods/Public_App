
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSpaces, updateSpace, deleteSpace, getAllUsers, updateUserRoles } from '@/lib/firebase';
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
import { ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type EditableSpaceState = {
    authorName: string;
    hostName: string;
    isActive: boolean;
    isSaving: boolean;
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
    const [activeTab, setActiveTab] = useState("members"); // Control active tab state

    const [editableSpaces, setEditableSpaces] = useState<Record<string, EditableSpaceState>>({});
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

            const sortedSpaces = spacesWithDates.sort((a, b) => a.name.localeCompare(b.name));
            setSpaces(sortedSpaces);
            setUsers(fetchedUsers);
            
            const initialEditableState = sortedSpaces.reduce((acc, space) => {
                acc[space.id] = {
                    authorName: space.authorName || '',
                    hostName: space.hostName || '',
                    isActive: space.isActive === undefined ? true : space.isActive,
                    isSaving: false,
                };
                return acc;
            }, {} as Record<string, EditableSpaceState>);
            setEditableSpaces(initialEditableState);

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


    const handleSpaceFieldChange = (spaceId: string, field: keyof Omit<EditableSpaceState, 'isSaving'>, value: string | boolean) => {
        setEditableSpaces(prev => ({
            ...prev,
            [spaceId]: {
                ...prev[spaceId],
                [field]: value
            }
        }));
    };

    const copyAuthorToHost = (spaceId: string) => {
        const authorName = editableSpaces[spaceId]?.authorName;
        if (authorName) {
            handleSpaceFieldChange(spaceId, 'hostName', authorName);
        }
    };

    const copyHostToAuthor = (spaceId: string) => {
        const hostName = editableSpaces[spaceId]?.hostName;
        if (hostName) {
            handleSpaceFieldChange(spaceId, 'authorName', hostName);
        }
    };

    const handleSaveSpaceChanges = async (spaceId: string) => {
        const originalSpace = spaces.find(s => s.id === spaceId);
        if (!originalSpace) return;
        
        const { authorName, hostName, isActive } = editableSpaces[spaceId];
        const updates: Partial<Space> = {};

        if (authorName !== originalSpace.authorName) {
            updates.authorName = authorName;
        }
        if (hostName !== originalSpace.hostName) {
            updates.hostName = hostName;
        }
        if (isActive !== (originalSpace.isActive === undefined ? true : originalSpace.isActive)) {
            updates.isActive = isActive;
        }

        if (Object.keys(updates).length === 0) {
            toast({ title: "No changes to save.", variant: "default" });
            return;
        }

        setEditableSpaces(prev => ({ ...prev, [spaceId]: { ...prev[spaceId], isSaving: true } }));

        try {
            await updateSpace(spaceId, updates);
            toast({ title: "Success", description: `Changes for "${originalSpace.name}" have been saved.` });
            setSpaces(prevSpaces => prevSpaces.map(s => 
                s.id === spaceId ? { ...s, ...updates } : s
            ));
        } catch (error) {
            console.error("Failed to save space changes:", error);
            toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
            // Revert changes on failure
            setEditableSpaces(prev => ({
                ...prev,
                [spaceId]: {
                    ...prev[spaceId],
                    authorName: originalSpace.authorName || '',
                    hostName: originalSpace.hostName || '',
                    isActive: originalSpace.isActive === undefined ? true : originalSpace.isActive,
                }
            }));
        } finally {
            setEditableSpaces(prev => ({ ...prev, [spaceId]: { ...prev[spaceId], isSaving: false } }));
        }
    };
    
    const handleDeleteSpace = async (spaceId: string) => {
        try {
            await deleteSpace(spaceId);
            toast({ title: "Event Deleted", description: "The event has been successfully removed." });
            setSpaces(prev => prev.filter(s => s.id !== spaceId));
        } catch (error) {
            console.error("Failed to delete space:", error);
            toast({ title: "Error", description: "Could not delete the event.", variant: "destructive" });
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
            <div className="w-full max-w-6xl space-y-4">
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
                <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                                    <TableHead className="w-[100px] text-center">Certified</TableHead>
                                    <TableHead className="w-[100px] text-center">Super Admin</TableHead>
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
                                                checked={editableRoles[user.uid]?.isCertified ?? false}
                                                onCheckedChange={(checked) => handleRoleChange(user.uid, 'isCertified', !!checked)}
                                                aria-label={`Set certified status for ${user.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={editableRoles[user.uid]?.isSuperAdmin ?? false}
                                                onCheckedChange={(checked) => handleRoleChange(user.uid, 'isSuperAdmin', !!checked)}
                                                aria-label={`Set super admin for ${user.name}`}
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
                                    <TableHead className="w-[25%]">Event Name</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead className="w-[40px] p-0"></TableHead>
                                    <TableHead>Host</TableHead>
                                    <TableHead className="w-[60px] text-center">Active</TableHead>
                                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSpaces.map((space) => {
                                    const editState = editableSpaces[space.id];
                                    if (!editState) return null; // Should not happen
                                    
                                    const { authorName, hostName, isActive, isSaving } = editState;
                                    const namesAreDifferent = authorName !== hostName;
                                    const isOriginalActive = space.isActive === undefined ? true : space.isActive;
                                    const isChanged = authorName !== space.authorName || hostName !== space.hostName || isActive !== isOriginalActive;

                                    return (
                                        <TableRow key={space.id}>
                                            <TableCell className="font-medium">{space.name}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    value={authorName || ''}
                                                    onChange={(e) => handleSpaceFieldChange(space.id, 'authorName', e.target.value)}
                                                    className={cn("h-8", namesAreDifferent && "bg-muted border-foreground/30")}
                                                    disabled={isSaving}
                                                />
                                            </TableCell>
                                            <TableCell className="px-1 align-middle">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Button 
                                                        variant="ghost"
                                                        size="icon" 
                                                        className="h-6 w-6"
                                                        onClick={() => copyAuthorToHost(space.id)}
                                                        disabled={isSaving}
                                                        title="Copy Author to Host"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost"
                                                        size="icon" 
                                                        className="h-6 w-6"
                                                        onClick={() => copyHostToAuthor(space.id)}
                                                        disabled={isSaving}
                                                        title="Copy Host to Author"
                                                    >
                                                        <ArrowLeft className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                             <TableCell>
                                                <Input 
                                                    value={hostName || ''}
                                                    onChange={(e) => handleSpaceFieldChange(space.id, 'hostName', e.target.value)}
                                                    className={cn("h-8", namesAreDifferent && "bg-muted border-foreground/30")}
                                                    disabled={isSaving}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={isActive}
                                                    onCheckedChange={(checked) => handleSpaceFieldChange(space.id, 'isActive', !!checked)}
                                                    disabled={isSaving}
                                                    aria-label={`Set active status for ${space.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveSpaceChanges(space.id)}
                                                    disabled={isSaving || !isChanged}
                                                >
                                                    {isSaving ? 'Saving...' : 'Save'}
                                                </Button>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                     <Button variant="destructive" size="sm" disabled={isSaving}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the event
                                                        "{space.name}".
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                      <AlertDialogAction
                                                        onClick={() => handleDeleteSpace(space.id)}
                                                        className="bg-destructive hover:bg-destructive/90">
                                                        Yes, delete event
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
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

    

    