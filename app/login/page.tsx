"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ChevronLeft, Loader2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { LoginForm } from "@/components/auth/LoginForm"
import { useAuth } from "@/components/auth/AuthProvider"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.replace("/dashboard")
        }
    }, [loading, isAuthenticated, router])

    if (loading || isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center mx-auto">
            <Link
                href="/"
                className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "absolute left-4 top-4 md:left-8 md:top-8"
                )}
            >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
            </Link>
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials to sign in to your account
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}
