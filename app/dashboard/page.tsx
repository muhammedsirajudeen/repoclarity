"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Database,
    GitBranch,
    FileCode,
    Loader2,
    ArrowRight,
    Lock,
    Globe,
    Plus,
    Layers,
    Code,
    ExternalLink,
    Sparkles,
    Eye,
} from "lucide-react"
import apiClient from "@/lib/api/client"
import { ConnectRepoDialog } from "@/components/repos/ConnectRepoDialog"
import { SubscriptionSuccessDialog } from "@/components/layout/SubscriptionSuccessDialog"

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
    hasDiagram: boolean
    connectedAt: string
}

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const [repos, setRepos] = useState<ConnectedRepo[]>([])
    const [diagrams, setDiagrams] = useState<{ _id: string; models: { name: string }[] }[]>([])
    const [statsLoading, setStatsLoading] = useState(true)

    const fetchStats = useCallback(async () => {
        try {
            const [reposRes, diagramsRes] = await Promise.all([
                apiClient.get("/repos"),
                apiClient.get("/diagrams"),
            ])
            setRepos(reposRes.data.repos)
            setDiagrams(diagramsRes.data.diagrams || [])
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

    const totalModels = useMemo(() => {
        return diagrams.reduce((sum, d) => sum + (d.models?.length || 0), 0)
    }, [diagrams])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const recentRepos = repos.slice(0, 3)

    return (
        <div className="space-y-8">
            {/* Subscription success modal */}
            <Suspense fallback={null}>
                <SubscriptionSuccessDialog />
            </Suspense>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome, {user?.name || user?.username}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s an overview of your repositories and diagrams.
                    </p>
                </div>
                <ConnectRepoDialog onRepoConnected={fetchStats} />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/dashboard/diagrams" className="block">
                    <StatCard
                        icon={<Database className="h-5 w-5" />}
                        label="Diagrams"
                        value={diagrams.length}
                        loading={statsLoading}
                        interactive
                    />
                </Link>
                <Link href="/dashboard/repos" className="block">
                    <StatCard
                        icon={<GitBranch className="h-5 w-5" />}
                        label="Connected Repos"
                        value={repos.length}
                        loading={statsLoading}
                        interactive
                    />
                </Link>
                <StatCard
                    icon={<FileCode className="h-5 w-5" />}
                    label="Models Detected"
                    value={totalModels}
                    loading={statsLoading}
                />
            </div>

            {/* Two-column layout */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Repositories */}
                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-primary" />
                            <h2 className="font-semibold">Recent Repositories</h2>
                        </div>
                        {repos.length > 0 && (
                            <Link href="/dashboard/repos">
                                <Button variant="ghost" size="sm" className="text-xs gap-1">
                                    View all
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        )}
                    </div>
                    <div className="p-5">
                        {statsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : recentRepos.length === 0 ? (
                            <EmptyState
                                icon={<GitBranch className="h-10 w-10" />}
                                title="No repositories connected"
                                description="Connect a GitHub repository to start generating diagrams."
                            >
                                <ConnectRepoDialog onRepoConnected={fetchStats} trigger={
                                    <Button size="sm" className="mt-3 gap-1">
                                        <Plus className="h-3.5 w-3.5" />
                                        Connect Repository
                                    </Button>
                                } />
                            </EmptyState>
                        ) : (
                            <div className="space-y-3">
                                {recentRepos.map((repo) => (
                                    <RepoPreviewCard key={repo._id} repo={repo} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Diagrams */}
                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-primary" />
                            <h2 className="font-semibold">Recent Diagrams</h2>
                        </div>
                    </div>
                    <div className="p-5">
                        <EmptyState
                            icon={<Sparkles className="h-10 w-10" />}
                            title="No diagrams yet"
                            description={
                                repos.length > 0
                                    ? "Generate your first diagram from a connected repository."
                                    : "Connect a repo first, then generate database diagrams."
                            }
                        >
                            {repos.length > 0 ? (
                                <Button size="sm" className="mt-3 gap-1" disabled>
                                    <Database className="h-3.5 w-3.5" />
                                    Generate Diagram
                                </Button>
                            ) : (
                                <ConnectRepoDialog onRepoConnected={fetchStats} trigger={
                                    <Button size="sm" variant="outline" className="mt-3 gap-1">
                                        <Plus className="h-3.5 w-3.5" />
                                        Connect Repository
                                    </Button>
                                } />
                            )}
                        </EmptyState>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="border-b px-5 py-4">
                    <h2 className="font-semibold">Quick Actions</h2>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                    <ConnectRepoDialog onRepoConnected={fetchStats} trigger={
                        <button className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-left transition-colors hover:bg-accent/50 hover:border-primary/50">
                            <div className="rounded-md bg-primary/10 p-2">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Connect Repository</p>
                                <p className="text-xs text-muted-foreground">
                                    Link a GitHub repo
                                </p>
                            </div>
                        </button>
                    } />
                    <Link href="/dashboard/diagrams">
                        <button
                            className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-left transition-colors hover:bg-accent/50 hover:border-primary/50 w-full"
                        >
                            <div className="rounded-md bg-primary/10 p-2">
                                <Database className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">View Diagrams</p>
                                <p className="text-xs text-muted-foreground">
                                    View DB diagrams
                                </p>
                            </div>
                        </button>
                    </Link>
                    <button
                        disabled
                        className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-left opacity-50"
                    >
                        <div className="rounded-md bg-primary/10 p-2">
                            <FileCode className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Scan Models</p>
                            <p className="text-xs text-muted-foreground">
                                Detect ORM models
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ────── Sub-components ────── */

function StatCard({
    icon,
    label,
    value,
    loading,
    interactive = false,
}: {
    icon: React.ReactNode
    label: string
    value: number
    loading: boolean
    interactive?: boolean
}) {
    return (
        <div
            className={`rounded-lg border bg-card p-5 shadow-sm transition-colors ${interactive ? "hover:bg-accent/30 cursor-pointer" : ""
                }`}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                    {icon}
                </div>
            </div>
            <p className="mt-2 text-3xl font-bold">
                {loading ? "–" : value}
            </p>
        </div>
    )
}

function RepoPreviewCard({ repo }: { repo: ConnectedRepo }) {
    return (
        <div className="group flex items-center gap-3 overflow-hidden rounded-lg border p-3 transition-colors hover:bg-accent/30">
            <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                    {repo.isPrivate ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate font-medium text-sm">{repo.name}</span>
                </div>
                {repo.description && (
                    <p className="mt-1 truncate text-xs text-muted-foreground pl-[22px]">
                        {repo.description}
                    </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[22px]">
                    {repo.language && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {repo.language}
                        </Badge>
                    )}
                    {repo.dbType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Database className="h-2.5 w-2.5" />
                            {repo.dbType.toUpperCase()}
                        </Badge>
                    )}
                    {repo.orm && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Layers className="h-2.5 w-2.5" />
                            {repo.orm}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <Link href={
                    repo.hasDiagram
                        ? `/dashboard/diagrams?repoId=${repo._id}`
                        : `/dashboard/diagrams/generate?repoId=${repo._id}`
                }>
                    <Button
                        size="sm"
                        variant={repo.hasDiagram ? "outline" : "default"}
                        className="h-7 text-xs gap-1"
                    >
                        {repo.hasDiagram ? (
                            <><Eye className="h-3 w-3" /> View Diagram</>
                        ) : (
                            <><Sparkles className="h-3 w-3" /> Generate Diagram</>
                        )}
                    </Button>
                </Link>
                <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </a>
            </div>
        </div>
    )
}

function EmptyState({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode
    title: string
    description: string
    children?: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-muted-foreground/50">{icon}</div>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">
                {description}
            </p>
            {children}
        </div>
    )
}
