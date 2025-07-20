
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSpaces, getAllUsers } from '@/lib/firebase';
import type { Space, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function AdminDashboard() {
    const { user, isSuperAdmin } = useAuth();
    const [spaces, setSpaces] = useState<Omit<Space, 'dateTime'>[]>([]);
    const [users, setUsers] = useState<Omit<User, 'uid'>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const fetchedSpaces = await getSpaces();
            setSpaces(fetchedSpaces);

            if (isSuperAdmin) {
                const fetchedUsers = await getAllUsers();
                setUsers(fetchedUsers);
            }
            setLoading(false);
        };

        fetchData();
    }, [isSuperAdmin]);

    const adminSpaces = useMemo(() => {
        if (!user) return [];
        return spaces.filter(space => space.createdBy === user.uid);
    }, [spaces, user]);
    
    if (loading) {
        return (
            <div className="w-full max-w-4xl space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (isSuperAdmin) {
        return (
             <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Super Admin Dashboard</CardTitle>
                    <CardDescription>Manage events and members across the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="events">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="events">All Events ({spaces.length})</TabsTrigger>
                            <TabsTrigger value="members">All Members ({users.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="events" className="mt-4">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event Name</TableHead>
                                        <TableHead>Author</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {spaces.map((space) => (
                                        <TableRow key={space.id}>
                                            <TableCell className="font-medium">{space.name}</TableCell>
                                            <TableCell>{space.authorName}</TableCell>
                                            <TableCell>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/edit-space/${space.id}`}>Edit</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="members" className="mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((member, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell>{member.email}</TableCell>
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

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Admin Dashboard</CardTitle>
                <CardDescription>
                    Here is a list of events you have created.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm font-medium">Your Events ({adminSpaces.length})</p>
                <Select>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an event to manage" />
                    </SelectTrigger>
                    <SelectContent>
                        {adminSpaces.map(space => (
                            <SelectItem key={space.id} value={space.id} asChild>
                                 <Link href={`/edit-space/${space.id}`} className="w-full block">
                                    {space.name}
                                 </Link>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button asChild className="w-full">
                    <Link href="/create-space">Create New Moment</Link>
                 </Button>
            </CardContent>
        </Card>
    );
}

