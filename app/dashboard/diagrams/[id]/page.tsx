"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Loader2,
    ExternalLink,
    Trash2,
    RefreshCw,
    Database,
    Layers,
    AlertCircle,
} from "lucide-react"

import apiClient from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DiagramRenderer } from "@/components/diagrams/DiagramRenderer"

interface FieldDef {
    name: string
    type: string
    required: boolean
    ref?: string
    isArray: boolean
    defaultValue?: string
    enumValues?: string[]
}

interface ModelDef {
    name: string
    filePath: string
    fields: FieldDef[]
}

interface RepoInfo {
    _id: string
    name: string
    fullName: string
    owner: string
    orm: string
    dbType: string
    url: string
}

interface DiagramData {
    _id: string
    repositoryId: RepoInfo
    models: ModelDef[]
    createdAt: string
    updatedAt: string
}

export default function DiagramViewPage() {
    const params = useParams()
    const router = useRouter()
    const diagramId = params.id as string

    const [diagram, setDiagram] = useState<DiagramData | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [regenerating, setRegenerating] = useState(false)

    const fetchDiagram = useCallback(async () => {
        try {
            const res = await apiClient.get(`/diagrams/${diagramId}`)
            setDiagram(res.data.diagram)
        } catch {
            setDiagram(null)
        } finally {
            setLoading(false)
        }
    }, [diagramId])

    useEffect(() => {
        fetchDiagram()
    }, [fetchDiagram])

    const handleDelete = async () => {
        if (!diagram) return
        setDeleting(true)
        try {
            await apiClient.delete(`/diagrams/${diagram._id}`)
            router.push("/dashboard/diagrams")
        } catch {
            setDeleting(false)
        }
    }

    const handleRegenerate = async () => {
        if (!diagram) return
        setRegenerating(true)
        try {
            const res = await apiClient.post("/diagrams/generate", {
                repoId: diagram.repositoryId._id,
            })
            if (res.data.diagram) {
                setDiagram(res.data.diagram)
            }
        } catch {
            // silently fail
        } finally {
            setRegenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!diagram) {
        return (
            <div className="space-y-6">
                <Link href="/dashboard/diagrams">
                    <Button variant="ghost" size="sm" className="gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Diagrams
                    </Button>
                </Link>
                <div className="rounded-lg border bg-card p-12 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">
                        Diagram not found
                    </h2>
                </div>
            </div>
        )
    }

    const repo = diagram.repositoryId
    const modelCount = diagram.models?.length || 0
    const totalFields = diagram.models?.reduce(
        (sum, m) => sum + (m.fields?.length || 0),
        0
    ) || 0

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/diagrams">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {repo?.name || "Database Diagram"}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                                variant="secondary"
                                className="text-xs gap-1"
                            >
                                <Layers className="h-3 w-3" />
                                {modelCount} models
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {totalFields} fields
                            </Badge>
                            {repo?.orm && (
                                <Badge
                                    variant="outline"
                                    className="text-xs gap-1"
                                >
                                    <Database className="h-3 w-3" />
                                    {repo.orm}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={handleRegenerate}
                        disabled={regenerating}
                    >
                        {regenerating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Regenerate
                    </Button>
                    {repo?.url && (
                        <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                GitHub
                            </Button>
                        </a>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                    </Button>
                </div>
            </div>

            {/* Diagram canvas */}
            {diagram.models && diagram.models.length > 0 ? (
                <DiagramRenderer models={diagram.models} />
            ) : (
                <div className="rounded-lg border bg-card p-12 text-center">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">
                        No models found
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        No Mongoose schemas were detected in this repository.
                    </p>
                </div>
            )}
        </div>
    )
}
