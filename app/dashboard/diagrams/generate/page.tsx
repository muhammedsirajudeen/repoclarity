"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Database,
    Loader2,
    Sparkles,
    ArrowLeft,
    Clock,
    Layers,
    Code,
    AlertCircle,
} from "lucide-react"

import apiClient from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface RepoDetail {
    _id: string
    name: string
    fullName: string
    owner: string
    orm: string
    dbType: string
    backendLanguage: string
}

export default function GenerateDiagramPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <GenerateDiagramContent />
        </Suspense>
    )
}

function GenerateDiagramContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const repoId = searchParams.get("repoId")

    const [repo, setRepo] = useState<RepoDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState("")
    const [notFound, setNotFound] = useState(false)

    const fetchRepo = useCallback(async () => {
        if (!repoId) {
            setNotFound(true)
            setLoading(false)
            return
        }

        try {
            const res = await apiClient.get("/repos")
            const found = res.data.repos.find(
                (r: RepoDetail) => r._id === repoId
            )
            if (found) {
                setRepo(found)
            } else {
                setNotFound(true)
            }
        } catch {
            setError("Failed to load repository details.")
        } finally {
            setLoading(false)
        }
    }, [repoId])

    useEffect(() => {
        fetchRepo()
    }, [fetchRepo])

    const handleGenerate = async () => {
        if (!repo) return
        setGenerating(true)
        setError("")

        try {
            const res = await apiClient.post("/diagrams/generate", {
                repoId: repo._id,
            })

            if (res.data.supported === false) {
                setError(res.data.message || "Not supported")
                return
            }

            if (res.data.diagram) {
                router.push(`/dashboard/diagrams/${res.data.diagram._id}`)
            }
        } catch {
            setError("Failed to generate diagram. Please try again.")
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="space-y-6">
                <BackButton />
                <div className="rounded-lg border bg-card p-12 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">
                        Repository not found
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        The repository could not be found or you don&apos;t have
                        access.
                    </p>
                </div>
            </div>
        )
    }

    const isMongoose = repo?.orm === "mongoose"

    return (
        <div className="space-y-6">
            <BackButton />

            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Generate Diagram
                </h1>
                <p className="text-muted-foreground mt-1">
                    Scan repository for database schemas and generate a visual
                    diagram.
                </p>
            </div>

            {/* Repo info card */}
            {repo && (
                <div className="rounded-lg border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-md bg-primary/10 p-2">
                            <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">{repo.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {repo.fullName}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {repo.dbType && (
                            <Badge
                                variant="outline"
                                className="text-xs gap-1"
                            >
                                <Database className="h-3 w-3" />
                                {repo.dbType.toUpperCase()}
                            </Badge>
                        )}
                        {repo.backendLanguage && (
                            <Badge
                                variant="outline"
                                className="text-xs gap-1"
                            >
                                <Code className="h-3 w-3" />
                                {repo.backendLanguage}
                            </Badge>
                        )}
                        {repo.orm && (
                            <Badge
                                variant="outline"
                                className="text-xs gap-1"
                            >
                                <Layers className="h-3 w-3" />
                                {repo.orm}
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {/* Generate or Coming Soon */}
            {isMongoose ? (
                <div className="rounded-lg border bg-card p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold">
                        Ready to Generate
                    </h2>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                        We&apos;ll scan your repository for Mongoose schema
                        definitions and create an interactive database diagram.
                    </p>

                    {error && (
                        <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Button
                        size="lg"
                        className="mt-6 gap-2"
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Scanning Repository...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate Diagram
                            </>
                        )}
                    </Button>
                </div>
            ) : (
                <ComingSoonCard orm={repo?.orm || "this ORM"} />
            )}
        </div>
    )
}

function BackButton() {
    return (
        <Link href="/dashboard/repos">
            <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Repositories
            </Button>
        </Link>
    )
}

function ComingSoonCard({ orm }: { orm: string }) {
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-background/80 backdrop-blur border shadow-sm">
                    <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <Badge className="mt-4" variant="secondary">
                    Coming Soon
                </Badge>
                <h2 className="mt-3 text-2xl font-bold">
                    Support for{" "}
                    <span className="capitalize">{orm}</span> is on the way
                </h2>
                <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
                    We&apos;re working on adding diagram generation for{" "}
                    <span className="font-medium capitalize">{orm}</span>.
                    Currently, only Mongoose schemas are supported.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/dashboard/repos">
                        <Button variant="outline" className="gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Repositories
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
