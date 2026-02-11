"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Github } from "lucide-react"

export function LoginForm() {
    return (
        <Card className="w-[350px]">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Connect your GitHub account to get started.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button variant="outline" className="w-full">
                    <Github className="mr-2 h-4 w-4" />
                    Login with GitHub
                </Button>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-center text-muted-foreground w-full">
                    By clicking continue, you agree to our{" "}
                    <a
                        href="#"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                        href="#"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>
            </CardFooter>
        </Card>
    )
}
