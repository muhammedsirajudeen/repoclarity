"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Check,
    PartyPopper,
    Zap,
    Crown,
    GitBranch,
    Database,
    Headset,
    Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PLANS, type PlanId } from "@/lib/utils/subscriptionPlans"

const planIcons: Record<string, React.ReactNode> = {
    pro: <Zap className="h-8 w-8" />,
    business: <Crown className="h-8 w-8" />,
}

const planGradients: Record<string, string> = {
    pro: "from-blue-500 to-cyan-500",
    business: "from-violet-600 to-indigo-600",
}

interface BenefitItem {
    icon: React.ReactNode
    text: string
}

function getBenefits(plan: PlanId): BenefitItem[] {
    const p = PLANS[plan]
    if (!p) return []

    const benefits: BenefitItem[] = []

    if (p.repoLimit === -1) {
        benefits.push({
            icon: <GitBranch className="h-4 w-4" />,
            text: "Unlimited repository connections",
        })
    } else {
        benefits.push({
            icon: <GitBranch className="h-4 w-4" />,
            text: `Connect up to ${p.repoLimit} repositories`,
        })
    }

    if (p.diagramsPerDay === -1) {
        benefits.push({
            icon: <Database className="h-4 w-4" />,
            text: "Unlimited diagram generations per day",
        })
    } else {
        benefits.push({
            icon: <Database className="h-4 w-4" />,
            text: `${p.diagramsPerDay} diagram generations per day`,
        })
    }

    benefits.push({
        icon: <Layers className="h-4 w-4" />,
        text: "Advanced database visualization",
    })

    benefits.push({
        icon: <Headset className="h-4 w-4" />,
        text: "Priority support",
    })

    return benefits
}

export function SubscriptionSuccessDialog() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const isSubscribed = searchParams.get("subscribed") === "true"
    // Read plan from URL query param (set during checkout redirect)
    const plan = (searchParams.get("plan") || "pro") as PlanId
    const benefits = getBenefits(plan)
    const planDef = PLANS[plan]

    useEffect(() => {
        if (isSubscribed) {
            setOpen(true)
        }
    }, [isSubscribed])

    const handleClose = () => {
        setOpen(false)
        // Remove the query param without a full page reload
        router.replace("/dashboard", { scroll: false })
    }

    if (!isSubscribed) return null

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    {/* Animated celebration icon */}
                    <div className={`
                        mx-auto mb-2 flex h-16 w-16 items-center justify-center
                        rounded-2xl bg-gradient-to-br ${planGradients[plan] || planGradients.pro}
                        text-white shadow-lg animate-in zoom-in-50 duration-500
                    `}>
                        {planIcons[plan] || <Zap className="h-8 w-8" />}
                    </div>

                    <div className="flex items-center justify-center gap-2 animate-in fade-in duration-700">
                        <PartyPopper className="h-5 w-5 text-amber-500" />
                        <DialogTitle className="text-xl">
                            Welcome to {planDef?.name || "Pro"}!
                        </DialogTitle>
                        <PartyPopper className="h-5 w-5 text-amber-500 -scale-x-100" />
                    </div>

                    <DialogDescription className="text-center pt-1">
                        Your subscription is now active. Enjoy your upgraded
                        experience!
                    </DialogDescription>
                </DialogHeader>

                {/* Benefits list */}
                <div className="mt-2 rounded-xl border bg-accent/30 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        What you get
                    </p>
                    {benefits.map((benefit, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 animate-in slide-in-from-left duration-300"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {benefit.icon}
                            </div>
                            <span className="text-sm font-medium">
                                {benefit.text}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Button
                    onClick={handleClose}
                    className="w-full mt-2 gap-2"
                    size="lg"
                >
                    <Check className="h-4 w-4" />
                    Start Exploring
                </Button>
            </DialogContent>
        </Dialog>
    )
}
