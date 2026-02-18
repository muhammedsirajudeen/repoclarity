"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
    Database,
    Loader2,
    Sparkles,
    Eye,
    Trash2,
    Layers,
    Calendar,
    GitBranch,
} from "lucide-react"

import apiClient from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConnectRepoDialog } from "@/components/repos/ConnectRepoDialog"

interface DiagramRepo {
    _id: string
    name: string
    fullName: string
    owner: string
    orm: string
    dbType: string
}

interface DiagramListItem {
    _id: string
    repositoryId: DiagramRepo
    models: { name: string; fields: unknown[] }[]
    createdAt: string
    updatedAt: string
}

export default function DiagramsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <DiagramsContent />
        </Suspense>
    )
}

function DiagramsContent() {
    const [diagrams, setDiagrams] = useState<DiagramListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const repoIdFilter = searchParams.get("repoId")

    const fetchDiagrams = useCallback(async () => {
        try {
            const url = repoIdFilter
                ? `/diagrams?repoId=${repoIdFilter}`
                : "/diagrams"
            const res = await apiClient.get(url)
            setDiagrams(res.data.diagrams)
        } catch (err) {
            console.error("Failed to fetch diagrams:", err)
        } finally {
            setLoading(false)
        }
    }, [repoIdFilter])

    useEffect(() => {
        fetchDiagrams()
    }, [fetchDiagrams])

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await apiClient.delete(`/diagrams/${id}`)
            setDiagrams((prev) => prev.filter((d) => d._id !== id))
        } catch (err) {
            console.error("Failed to delete diagram:", err)
        } finally {
            setDeletingId(null)
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
                        Diagrams
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Your generated database diagrams.
                    </p>
                </div>
                <ConnectRepoDialog onRepoConnected={fetchDiagrams} />
            </div>

            {diagrams.length === 0 ? (
                <div className="rounded-lg border bg-card p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold">
                        No diagrams yet
                    </h2>
                    <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                        Connect a repository and generate a database diagram to
                        visualize your Mongoose schemas.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {diagrams.map((diagram) => (
                        <DiagramCard
                            key={diagram._id}
                            diagram={diagram}
                            onDelete={handleDelete}
                            isDeleting={deletingId === diagram._id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function DiagramCard({
    diagram,
    onDelete,
    isDeleting,
}: {
    diagram: DiagramListItem
    onDelete: (id: string) => void
    isDeleting: boolean
}) {
    const repo = diagram.repositoryId
    const modelCount = diagram.models?.length || 0
    const totalFields = diagram.models?.reduce(
        (sum, m) => sum + (m.fields?.length || 0),
        0
    ) || 0

    return (
        <div className="group rounded-lg border bg-card p-5 shadow-sm transition-colors hover:bg-accent/30">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-md bg-primary/10 p-1.5">
                        <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold truncate text-sm">
                            {repo?.name || "Unknown Repo"}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                            {repo?.fullName}
                        </p>
                    </div>
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => onDelete(diagram._id)}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs gap-1">
                    <Layers className="h-3 w-3" />
                    {modelCount} {modelCount === 1 ? "model" : "models"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                    {totalFields} fields
                </Badge>
                {repo?.orm && (
                    <Badge variant="outline" className="text-xs gap-1">
                        <GitBranch className="h-3 w-3" />
                        {repo.orm}
                    </Badge>
                )}
            </div>

            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(diagram.updatedAt).toLocaleDateString()}
            </p>

            <div className="mt-3 border-t pt-3">
                <Link href={`/dashboard/diagrams/${diagram._id}`}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        View Diagram
                    </Button>
                </Link>
            </div>
        </div>
    )
}
