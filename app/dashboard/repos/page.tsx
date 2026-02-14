"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
    GitBranch,
    Lock,
    Globe,
    Loader2,
    ExternalLink,
    Trash2,
    Database,
    Code,
    Layers,
} from "lucide-react"

import apiClient from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConnectRepoDialog } from "@/components/repos/ConnectRepoDialog"

interface ConnectedRepo {
    _id: string
    githubRepoId: number
    name: string
    fullName: string
    owner: string
    description: string
    language: string
    defaultBranch: string
    isPrivate: boolean
    url: string
    dbType: string
    backendLanguage: string
    orm: string
    connectedAt: string
}

export default function ReposPage() {
    const [repos, setRepos] = useState<ConnectedRepo[]>([])
    const [loading, setLoading] = useState(true)
    const [removingId, setRemovingId] = useState<string | null>(null)

    const fetchConnectedRepos = useCallback(async () => {
        try {
            const res = await apiClient.get("/repos")
            setRepos(res.data.repos)
        } catch (err) {
            console.error("Failed to fetch connected repos:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchConnectedRepos()
    }, [fetchConnectedRepos])

    const handleRemove = async (repo: ConnectedRepo) => {
        setRemovingId(repo._id)
        try {
            await apiClient.delete(
                `/repos?githubRepoId=${repo.githubRepoId}`
            )
            setRepos((prev) => prev.filter((r) => r._id !== repo._id))
        } catch (err) {
            console.error("Failed to remove repo:", err)
        } finally {
            setRemovingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Repositories
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your connected GitHub repositories.
                    </p>
                </div>
                <ConnectRepoDialog
                    onRepoConnected={fetchConnectedRepos}
                />
            </div>

            {repos.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center">
                    <GitBranch className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">
                        No repositories connected
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Connect a GitHub repository to start generating
                        database diagrams.
                    </p>
                    <div className="mt-4">
                        <ConnectRepoDialog
                            onRepoConnected={fetchConnectedRepos}
                        />
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repos.map((repo) => (
                        <div
                            key={repo._id}
                            className="group rounded-lg border bg-card p-5 shadow-sm transition-colors hover:bg-accent/30"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    {repo.isPrivate ? (
                                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    ) : (
                                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    )}
                                    <h3 className="font-semibold truncate">
                                        {repo.name}
                                    </h3>
                                </div>
                                <div className="flex gap-1 shrink-0 ml-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        asChild
                                    >
                                        <a
                                            href={repo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemove(repo)}
                                        disabled={removingId === repo._id}
                                    >
                                        {removingId === repo._id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {repo.owner}/{repo.name}
                            </p>

                            {repo.description && (
                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                    {repo.description}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {repo.language && (
                                    <Badge variant="secondary" className="text-xs">
                                        {repo.language}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                    {repo.defaultBranch}
                                </Badge>
                            </div>

                            {(repo.dbType || repo.backendLanguage || repo.orm) && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2">
                                    {repo.dbType && (
                                        <Badge variant="outline" className="text-xs gap-1">
                                            <Database className="h-3 w-3" />
                                            {repo.dbType.toUpperCase()}
                                        </Badge>
                                    )}
                                    {repo.backendLanguage && (
                                        <Badge variant="outline" className="text-xs gap-1">
                                            <Code className="h-3 w-3" />
                                            {repo.backendLanguage}
                                        </Badge>
                                    )}
                                    {repo.orm && (
                                        <Badge variant="outline" className="text-xs gap-1">
                                            <Layers className="h-3 w-3" />
                                            {repo.orm}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
