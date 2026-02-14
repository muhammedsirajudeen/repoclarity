"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Database, GitBranch, FileCode, Loader2 } from "lucide-react"
import apiClient from "@/lib/api/client"
import { ConnectRepoDialog } from "@/components/repos/ConnectRepoDialog"

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const [repoCount, setRepoCount] = useState(0)
    const [statsLoading, setStatsLoading] = useState(true)

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get("/repos")
            setRepoCount(res.data.repos.length)
        } catch {
            // Not critical — silently fail
        } finally {
            setStatsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!loading && user) {
            fetchStats()
        }
    }, [loading, user, fetchStats])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome, {user?.name || user?.username}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s an overview of your repositories and diagrams.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Database className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Diagrams
                            </p>
                            <p className="text-2xl font-bold">0</p>
                        </div>
                    </div>
                </div>
                <Link href="/dashboard/repos" className="block">
                    <div className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:bg-accent/30">
                        <div className="flex items-center gap-3">
                            <GitBranch className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Connected Repos
                                </p>
                                <p className="text-2xl font-bold">
                                    {statsLoading ? "–" : repoCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <FileCode className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Models Detected
                            </p>
                            <p className="text-2xl font-bold">0</p>
                        </div>
                    </div>
                </div>
            </div>

            {repoCount === 0 && !statsLoading && (
                <div className="rounded-lg border bg-card p-8 text-center">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">
                        No diagrams yet
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Connect a GitHub repository to generate your first
                        database diagram.
                    </p>
                    <div className="mt-4">
                        <ConnectRepoDialog onRepoConnected={fetchStats} />
                    </div>
                </div>
            )}
        </div>
    )
}
