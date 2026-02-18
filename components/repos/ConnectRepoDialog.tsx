"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Search,
    Loader2,
    Lock,
    Globe,
    Plus,
    ArrowLeft,
    Database,
    Code,
    Layers,
    Check,
} from "lucide-react"

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

const DB_TYPES = [
    { id: "sql", label: "SQL", description: "PostgreSQL, MySQL, SQLite, etc.", comingSoon: true },
    { id: "nosql", label: "NoSQL", description: "MongoDB, DynamoDB, etc.", comingSoon: false },
]

const LANGUAGES: Record<string, { id: string; label: string; comingSoon?: boolean }[]> = {
    sql: [
        { id: "javascript", label: "JavaScript / TypeScript", comingSoon: true },
        { id: "python", label: "Python", comingSoon: true },
        { id: "java", label: "Java", comingSoon: true },
        { id: "go", label: "Go", comingSoon: true },
        { id: "csharp", label: "C#", comingSoon: true },
        { id: "ruby", label: "Ruby", comingSoon: true },
        { id: "php", label: "PHP", comingSoon: true },
    ],
    nosql: [
        { id: "javascript", label: "JavaScript / TypeScript" },
        { id: "python", label: "Python", comingSoon: true },
        { id: "java", label: "Java", comingSoon: true },
        { id: "go", label: "Go", comingSoon: true },
        { id: "csharp", label: "C#", comingSoon: true },
        { id: "ruby", label: "Ruby", comingSoon: true },
    ],
}

const ORM_OPTIONS: Record<string, Record<string, { id: string; label: string; comingSoon?: boolean }[]>> = {
    sql: {
        javascript: [
            { id: "prisma", label: "Prisma", comingSoon: true },
            { id: "typeorm", label: "TypeORM", comingSoon: true },
            { id: "sequelize", label: "Sequelize", comingSoon: true },
            { id: "drizzle", label: "Drizzle", comingSoon: true },
            { id: "knex", label: "Knex.js", comingSoon: true },
        ],
        python: [
            { id: "sqlalchemy", label: "SQLAlchemy", comingSoon: true },
            { id: "django-orm", label: "Django ORM", comingSoon: true },
            { id: "peewee", label: "Peewee", comingSoon: true },
            { id: "tortoise", label: "Tortoise ORM", comingSoon: true },
        ],
        java: [
            { id: "hibernate", label: "Hibernate", comingSoon: true },
            { id: "jpa", label: "Spring Data JPA", comingSoon: true },
            { id: "mybatis", label: "MyBatis", comingSoon: true },
            { id: "jooq", label: "jOOQ", comingSoon: true },
        ],
        go: [
            { id: "gorm", label: "GORM", comingSoon: true },
            { id: "ent", label: "Ent", comingSoon: true },
            { id: "sqlx", label: "sqlx", comingSoon: true },
        ],
        csharp: [
            { id: "ef-core", label: "Entity Framework Core", comingSoon: true },
            { id: "dapper", label: "Dapper", comingSoon: true },
            { id: "nhibernate", label: "NHibernate", comingSoon: true },
        ],
        ruby: [
            { id: "activerecord", label: "ActiveRecord", comingSoon: true },
            { id: "sequel", label: "Sequel", comingSoon: true },
        ],
        php: [
            { id: "eloquent", label: "Eloquent (Laravel)", comingSoon: true },
            { id: "doctrine", label: "Doctrine", comingSoon: true },
        ],
    },
    nosql: {
        javascript: [
            { id: "mongoose", label: "Mongoose" },
            { id: "prisma", label: "Prisma", comingSoon: true },
            { id: "typegoose", label: "Typegoose", comingSoon: true },
            { id: "mongodb-native", label: "MongoDB Native Driver", comingSoon: true },
        ],
        python: [
            { id: "pymongo", label: "PyMongo", comingSoon: true },
            { id: "mongoengine", label: "MongoEngine", comingSoon: true },
            { id: "odmantic", label: "ODMantic", comingSoon: true },
            { id: "motor", label: "Motor (async)", comingSoon: true },
        ],
        java: [
            { id: "spring-data-mongo", label: "Spring Data MongoDB", comingSoon: true },
            { id: "morphia", label: "Morphia", comingSoon: true },
        ],
        go: [
            { id: "mongo-go-driver", label: "MongoDB Go Driver", comingSoon: true },
            { id: "mgm", label: "mgm", comingSoon: true },
        ],
        csharp: [
            { id: "mongodb-csharp", label: "MongoDB C# Driver", comingSoon: true },
        ],
        ruby: [
            { id: "mongoid", label: "Mongoid", comingSoon: true },
        ],
    },
}

type WizardStep = "select-repo" | "db-type" | "language" | "orm"

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
    const [connecting, setConnecting] = useState(false)

    // Wizard state
    const [step, setStep] = useState<WizardStep>("select-repo")
    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
    const [dbType, setDbType] = useState("")
    const [backendLanguage, setBackendLanguage] = useState("")
    const [orm, setOrm] = useState("")

    const resetWizard = () => {
        setStep("select-repo")
        setSelectedRepo(null)
        setDbType("")
        setBackendLanguage("")
        setOrm("")
        setSearch("")
    }

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
            resetWizard()
        }
    }, [open, fetchGitHubRepos])

    const handleSelectRepo = (repo: GitHubRepo) => {
        setSelectedRepo(repo)
        setStep("db-type")
    }

    const handleSelectDbType = (type: string) => {
        setDbType(type)
        setStep("language")
    }

    const handleSelectLanguage = (lang: string) => {
        setBackendLanguage(lang)
        setStep("orm")
    }

    const handleSelectOrm = async (selectedOrm: string) => {
        if (!selectedRepo) return
        setOrm(selectedOrm)
        setConnecting(true)

        try {
            await apiClient.post("/repos", {
                githubRepoId: selectedRepo.githubRepoId,
                name: selectedRepo.name,
                fullName: selectedRepo.fullName,
                owner: selectedRepo.owner,
                description: selectedRepo.description,
                language: selectedRepo.language,
                defaultBranch: selectedRepo.defaultBranch,
                isPrivate: selectedRepo.isPrivate,
                url: selectedRepo.url,
                dbType,
                backendLanguage,
                orm: selectedOrm,
            })
            setRepos((prev) =>
                prev.map((r) =>
                    r.githubRepoId === selectedRepo.githubRepoId
                        ? { ...r, connected: true }
                        : r
                )
            )
            onRepoConnected()
            setOpen(false)
        } catch (err) {
            console.error("Failed to connect repo:", err)
        } finally {
            setConnecting(false)
        }
    }

    const handleBack = () => {
        if (step === "orm") setStep("language")
        else if (step === "language") setStep("db-type")
        else if (step === "db-type") setStep("select-repo")
    }

    const stepTitles: Record<WizardStep, string> = {
        "select-repo": "Connect a Repository",
        "db-type": "Select Database Type",
        language: "Select Backend Language",
        orm: "Select ORM / Driver",
    }

    const stepDescriptions: Record<WizardStep, string> = {
        "select-repo": "Choose a GitHub repository to connect.",
        "db-type": `Configure ${selectedRepo?.name || "repository"} — what type of database?`,
        language: `What language is the backend written in?`,
        orm: `Which ORM or database driver does it use?`,
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
            <DialogContent className="sm:max-w-[600px] overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {step !== "select-repo" && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={handleBack}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div>
                            <DialogTitle>{stepTitles[step]}</DialogTitle>
                            <DialogDescription>
                                {stepDescriptions[step]}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Step indicators */}
                <div className="flex items-center gap-1">
                    {(["select-repo", "db-type", "language", "orm"] as WizardStep[]).map(
                        (s, i) => (
                            <div
                                key={s}
                                className={`h-1 flex-1 rounded-full transition-colors ${i <= ["select-repo", "db-type", "language", "orm"].indexOf(step)
                                    ? "bg-primary"
                                    : "bg-muted"
                                    }`}
                            />
                        )
                    )}
                </div>

                {step === "select-repo" && (
                    <RepoSelectStep
                        repos={filteredRepos}
                        loading={loading}
                        search={search}
                        onSearch={setSearch}
                        onSelect={handleSelectRepo}
                    />
                )}

                {step === "db-type" && (
                    <OptionGrid
                        options={DB_TYPES.map((t) => ({
                            id: t.id,
                            label: t.label,
                            description: t.description,
                            icon: <Database className="h-6 w-6" />,
                            comingSoon: t.comingSoon,
                        }))}
                        onSelect={handleSelectDbType}
                    />
                )}

                {step === "language" && (
                    <OptionGrid
                        options={(LANGUAGES[dbType] || []).map((l) => ({
                            id: l.id,
                            label: l.label,
                            icon: <Code className="h-6 w-6" />,
                            comingSoon: l.comingSoon,
                        }))}
                        onSelect={handleSelectLanguage}
                    />
                )}

                {step === "orm" && (
                    <OptionGrid
                        options={(ORM_OPTIONS[dbType]?.[backendLanguage] || []).map((o) => ({
                            id: o.id,
                            label: o.label,
                            icon: <Layers className="h-6 w-6" />,
                            comingSoon: o.comingSoon,
                        }))}
                        onSelect={handleSelectOrm}
                        loading={connecting}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

/* ────── Sub-components ────── */

function RepoSelectStep({
    repos,
    loading,
    search,
    onSearch,
    onSelect,
}: {
    repos: GitHubRepo[]
    loading: boolean
    search: string
    onSearch: (v: string) => void
    onSelect: (repo: GitHubRepo) => void
}) {
    return (
        <>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search repositories..."
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    className="pl-9"
                />
            </div>
            <div className="overflow-hidden">
                <ScrollArea className="h-[350px]">
                    <div className="pr-3 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    Fetching repositories...
                                </span>
                            </div>
                        ) : repos.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                {search
                                    ? "No repositories match your search."
                                    : "No repositories found."}
                            </div>
                        ) : (
                            repos.map((repo) => (
                                <button
                                    key={repo.githubRepoId}
                                    onClick={() => !repo.connected && onSelect(repo)}
                                    disabled={repo.connected}
                                    className="flex w-full items-center gap-3 overflow-hidden rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
                                >
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            {repo.isPrivate ? (
                                                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            ) : (
                                                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            )}
                                            <span className="truncate font-medium text-sm">
                                                {repo.fullName}
                                            </span>
                                            {repo.connected && (
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                    Connected
                                                </Badge>
                                            )}
                                        </div>
                                        {repo.description && (
                                            <p className="mt-1 truncate text-xs text-muted-foreground pl-[22px]">
                                                {repo.description}
                                            </p>
                                        )}
                                        <div className="mt-1.5 flex items-center gap-2 pl-[22px]">
                                            {repo.language && (
                                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                    {repo.language}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </>
    )
}

function OptionGrid({
    options,
    onSelect,
    loading = false,
}: {
    options: { id: string; label: string; description?: string; icon: React.ReactNode; comingSoon?: boolean }[]
    onSelect: (id: string) => void
    loading?: boolean
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 py-2">
            {options.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => !opt.comingSoon && onSelect(opt.id)}
                    disabled={loading || opt.comingSoon}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${opt.comingSoon
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-accent/50 hover:border-primary/50"
                        } disabled:opacity-50`}
                >
                    <div className={`shrink-0 ${opt.comingSoon ? "text-muted-foreground" : "text-primary"}`}>
                        {opt.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{opt.label}</p>
                            {opt.comingSoon && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                    Coming Soon
                                </Badge>
                            )}
                        </div>
                        {opt.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {opt.description}
                            </p>
                        )}
                    </div>
                    {loading && !opt.comingSoon && (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto shrink-0" />
                    )}
                </button>
            ))}
        </div>
    )
}
