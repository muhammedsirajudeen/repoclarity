"use client"

import Link from "next/link"
import Image from "next/image"
import { Database, LogOut, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { useAuth } from "@/components/auth/AuthProvider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
    const { user, isAuthenticated, loading } = useAuth()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center mx-auto px-4">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Database className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            RepoClarity
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {/* Add nav links here if needed */}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Add search or other controls here */}
                    </div>
                    <nav className="flex items-center space-x-2">
                        <ModeToggle />
                        {!loading && isAuthenticated && user ? (
                            <UserMenu
                                name={user.name || user.username}
                                avatarUrl={user.avatarUrl}
                            />
                        ) : !loading ? (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost">Log in</Button>
                                </Link>
                                <Link href="/login">
                                    <Button>Get Started</Button>
                                </Link>
                            </>
                        ) : null}
                    </nav>
                </div>
            </div>
        </header>
    )
}

function UserMenu({
    name,
    avatarUrl,
}: {
    name: string
    avatarUrl: string
}) {
    const { logout } = useAuth()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                >
                    <Image
                        src={avatarUrl}
                        alt={name}
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                    <Image
                        src={avatarUrl}
                        alt={name}
                        width={24}
                        height={24}
                        className="rounded-full"
                    />
                    <p className="text-sm font-medium">{name}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href="/dashboard"
                        className="flex items-center cursor-pointer"
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
