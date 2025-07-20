
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSpaces, getAllUsers } from '@/lib/firebase';
import type { Space, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { Button } from './ui/button';

export function AdminDashboard() {
    const { isSuperAdmin } = useAuth();
    const [spaces, setSpaces] = useState<Omit<Space, 'dateTime'>[]>([]);
    const [users, setUsers] = useState<Omit<User, 'uid'>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!isSuperAdmin) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const [fetchedSpaces, fetchedUsers] = await Promise.all([
                getSpaces(),
                getAllUsers()
            ]);
            setSpaces(fetchedSpaces);
            setUsers(fetchedUsers);
            setLoading(false);
        };

        fetchData();
    }, [isSuperAdmin]);
    
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
        // This case should theoretically not be hit if the page route is protected correctly,
        // but it's good practice as a fallback.
        return null;
    }

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
