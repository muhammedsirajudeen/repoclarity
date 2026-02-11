"use client"

import Link from "next/link"
import { Database, Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"

export function Navbar() {
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
                        <Link href="/login">
                            <Button variant="ghost">Log in</Button>
                        </Link>
                        <Link href="/login">
                            <Button>Get Started</Button>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )
}
