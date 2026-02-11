"use client"

import Link from "next/link"
import { ArrowRight, Database } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10 mx-auto px-4">
            <div className="flex max-w-[980px] flex-col items-start gap-2">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1]">
                    Visualize your database
                    <br className="hidden sm:inline" />
                    directly from your GitHub repository.
                </h1>
                <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
                    RepoClarity automatically generates database diagrams from your codebase.
                    Understand your data architecture in seconds, not hours.
                </p>
            </div>
            <div className="flex gap-4">
                <Link href="/login">
                    <Button size="lg">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
                <Link href="https://github.com" target="_blank" rel="noreferrer">
                    <Button variant="outline" size="lg">
                        GitHub <Database className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </section>
    )
}
