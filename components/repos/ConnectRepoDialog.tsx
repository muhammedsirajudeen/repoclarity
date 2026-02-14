"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, Lock, Globe, Check, Plus, X } from "lucide-react"

import apiClient from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface GitHubRepo {
    githubRepoId: number
    name: string
    fullName: string
    owner: string
    description: string
    language: string
    defaultBranch: string
    isPrivate: boolean
    url: string
    updatedAt: string
    connected: boolean
}

interface ConnectRepoDialogProps {
    onRepoConnected: () => void
    trigger?: React.ReactNode
}

export function ConnectRepoDialog({
    onRepoConnected,
    trigger,
}: ConnectRepoDialogProps) {
    const [open, setOpen] = useState(false)
    const [repos, setRepos] = useState<GitHubRepo[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [connectingId, setConnectingId] = useState<number | null>(null)

    const fetchGitHubRepos = useCallback(async () => {
        setLoading(true)
        try {
            const res = await apiClient.get("/repos/github")
            setRepos(res.data.repos)
        } catch (err) {
            console.error("Failed to fetch repos:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (open) {
            fetchGitHubRepos()
        }
    }, [open, fetchGitHubRepos])

    const handleConnect = async (repo: GitHubRepo) => {
        setConnectingId(repo.githubRepoId)
        try {
            await apiClient.post("/repos", {
                githubRepoId: repo.githubRepoId,
                name: repo.name,
                fullName: repo.fullName,
                owner: repo.owner,
                description: repo.description,
                language: repo.language,
                defaultBranch: repo.defaultBranch,
                isPrivate: repo.isPrivate,
                url: repo.url,
            })
            setRepos((prev) =>
                prev.map((r) =>
                    r.githubRepoId === repo.githubRepoId
                        ? { ...r, connected: true }
                        : r
                )
            )
            onRepoConnected()
        } catch (err) {
            console.error("Failed to connect repo:", err)
        } finally {
            setConnectingId(null)
        }
    }

    const handleDisconnect = async (repo: GitHubRepo) => {
        setConnectingId(repo.githubRepoId)
        try {
            await apiClient.delete(
                `/repos?githubRepoId=${repo.githubRepoId}`
            )
            setRepos((prev) =>
                prev.map((r) =>
                    r.githubRepoId === repo.githubRepoId
                        ? { ...r, connected: false }
                        : r
                )
            )
            onRepoConnected()
        } catch (err) {
            console.error("Failed to disconnect repo:", err)
        } finally {
            setConnectingId(null)
        }
    }

    const filteredRepos = repos.filter(
        (repo) =>
            repo.name.toLowerCase().includes(search.toLowerCase()) ||
            repo.fullName.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Connect Repository
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Connect a Repository</DialogTitle>
                    <DialogDescription>
                        Select a GitHub repository to connect to RepoClarity.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search repositories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <ScrollArea className="h-[400px] pr-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">
                                Fetching repositories...
                            </span>
                        </div>
                    ) : filteredRepos.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            {search
                                ? "No repositories match your search."
                                : "No repositories found."}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredRepos.map((repo) => (
                                <RepoItem
                                    key={repo.githubRepoId}
                                    repo={repo}
                                    isLoading={
                                        connectingId === repo.githubRepoId
                                    }
                                    onConnect={() => handleConnect(repo)}
                                    onDisconnect={() =>
                                        handleDisconnect(repo)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function RepoItem({
    repo,
    isLoading,
    onConnect,
    onDisconnect,
}: {
    repo: GitHubRepo
    isLoading: boolean
    onConnect: () => void
    onDisconnect: () => void
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50">
            <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2">
                    {repo.isPrivate ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate font-medium text-sm">
                        {repo.fullName}
                    </span>
                </div>
                {repo.description && (
                    <p className="mt-1 truncate text-xs text-muted-foreground pl-5.5">
                        {repo.description}
                    </p>
                )}
                <div className="mt-1.5 flex items-center gap-2 pl-5.5">
                    {repo.language && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {repo.language}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="shrink-0">
                {isLoading ? (
                    <Button size="sm" variant="outline" disabled>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </Button>
                ) : repo.connected ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onDisconnect}
                        className="text-destructive hover:text-destructive"
                    >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Remove
                    </Button>
                ) : (
                    <Button size="sm" onClick={onConnect}>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Connect
                    </Button>
                )}
            </div>
        </div>
    )
}
