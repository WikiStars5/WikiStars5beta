
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockUser } from '@/lib/types'; // In a real app, this would come from an auth context/hook
import { User, LogIn, UserPlus, LogOut, ShieldCheck, Settings, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';

export function UserNav() {
  const [currentUser, setCurrentUser] = useState<typeof mockUser | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Simulate fetching user data or checking auth state
    setCurrentUser(mockUser); 
  }, []);

  if (!isClient) {
    // Render a placeholder or nothing during server render / hydration mismatch prevention
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 rounded-md bg-muted animate-pulse"></div>
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
      </div>
    );
  }

  if (currentUser) {
    const isAdmin = currentUser.id === 'user123'; // Simulated admin check

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={currentUser.avatarUrl || undefined} alt={currentUser.displayName || "User Avatar"} />
              <AvatarFallback>
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{currentUser.displayName || "User"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          {isAdmin && ( 
            <Link href="/admin">
              <DropdownMenuItem>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            </Link>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => alert('Logout action triggered (Simulated)')}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" asChild>
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Link>
      </Button>
      <Button asChild>
        <Link href="/signup">
          <UserPlus className="mr-2 h-4 w-4" /> Sign Up
        </Link>
      </Button>
    </div>
  );
}
