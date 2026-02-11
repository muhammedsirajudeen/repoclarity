"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Database, GitMerge, Lock, RefreshCw } from "lucide-react"

const features = [
    {
        title: "Instant Diagrams",
        description:
            "Connect your repository and get a complete database schema diagram in seconds.",
        icon: RefreshCw,
    },
    {
        title: "GitHub Integration",
        description:
            "Seamlessly integrates with your GitHub workflow. Automatically updates when you push code.",
        icon: GitMerge,
    },
    {
        title: "Secure by Design",
        description:
            "We never store your code. Your data is processed securely and ephemeral.",
        icon: Lock,
    },
    {
        title: "Multiple DB Support",
        description:
            "Supports PostgreSQL, MySQL, SQLite, and MongoDB schemas defined in your ORM.",
        icon: Database,
    },
]

export function Features() {
    return (
        <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24 mx-auto px-4">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                    Features
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Everything you need to visualize and document your database architecture.
                </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                {features.map((feature) => (
                    <Card key={feature.title} className="flex flex-col justify-between">
                        <CardHeader>
                            <feature.icon className="h-10 w-10 mb-2" />
                            <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base">
                                {feature.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
