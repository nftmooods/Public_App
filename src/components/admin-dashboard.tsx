
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getAllUsers, updateHostNameForUser } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export function AdminDashboard() {
    const { isSuperAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [editableUsers, setEditableUsers] = useState<Record<string, { name: string; isSaving: boolean }>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!isSuperAdmin) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const fetchedUsers = await getAllUsers();
                setUsers(fetchedUsers);
                
                const initialEditableState = fetchedUsers.reduce((acc, user) => {
                    acc[user.uid] = { name: user.name || '', isSaving: false };
                    return acc;
                }, {} as Record<string, { name: string; isSaving: boolean }>);
                setEditableUsers(initialEditableState);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSuperAdmin, toast]);
    
    const handleNameChange = (uid: string, newName: string) => {
        setEditableUsers(prev => ({
            ...prev,
            [uid]: { ...prev[uid], name: newName }
        }));
    };

    const handleSaveName = async (uid: string) => {
        const originalUser = users.find(u => u.uid === uid);
        const { name: newName } = editableUsers[uid];

        if (!originalUser || !newName || originalUser.name === newName) {
            return; // No change or invalid data
        }

        setEditableUsers(prev => ({ ...prev, [uid]: { ...prev[uid], isSaving: true } }));

        try {
            await updateHostNameForUser(uid, newName);
            toast({ title: "Success", description: `Host name updated to "${newName}".` });
            
            // Update local state to reflect the change
            setUsers(prevUsers => prevUsers.map(u => u.uid === uid ? { ...u, name: newName } : u));

        } catch (error) {
            console.error("Failed to update host name:", error);
            toast({ title: "Error", description: "Could not update host name.", variant: "destructive" });
            // Revert changes on error
            handleNameChange(uid, originalUser.name || '');
        } finally {
            setEditableUsers(prev => ({ ...prev, [uid]: { ...prev[uid], isSaving: false } }));
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
                <CardDescription>Manage hosts and co-hosts across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Host Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Certified</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">
                                    <Input
                                        value={editableUsers[user.uid]?.name || ''}
                                        onChange={(e) => handleNameChange(user.uid, e.target.value)}
                                        className="h-8"
                                    />
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Checkbox
                                        checked={!!user.isCertified}
                                        // onCheckedChange={(isChecked) => handleCertificationChange(user.uid, !!isChecked)} 
                                        aria-label={`Certify ${user.name}`}
                                        disabled // Re-enable when certification logic is fully implemented
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        size="sm"
                                        onClick={() => handleSaveName(user.uid)}
                                        disabled={editableUsers[user.uid]?.isSaving || editableUsers[user.uid]?.name === user.name}
                                    >
                                        {editableUsers[user.uid]?.isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
