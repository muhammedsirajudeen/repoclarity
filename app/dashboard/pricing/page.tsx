"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import {
    Check,
    Loader2,
    Zap,
    Crown,
    Sparkles,
    Rocket,
    ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/lib/api/client"
import { PLANS, type PlanId } from "@/lib/utils/subscriptionPlans"

const planMeta: Record<PlanId, {
    icon: React.ReactNode
    gradient: string
    border: string
    badge: string
}> = {
    free: {
        icon: <Sparkles className="h-7 w-7" />,
        gradient: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
        border: "border-zinc-200 dark:border-zinc-700",
        badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    },
    pro: {
        icon: <Zap className="h-7 w-7" />,
        gradient: "from-blue-500 to-cyan-500",
        border: "border-blue-400/50 ring-2 ring-blue-400/20",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    business: {
        icon: <Crown className="h-7 w-7" />,
        gradient: "from-violet-600 to-indigo-600",
        border: "border-violet-400/50",
        badge: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    },
}

export default function PricingPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState<PlanId | null>(null)
    const currentPlan = user?.subscriptionPlan || "free"

    const handleUpgrade = async (plan: PlanId) => {
        if (plan === "free" || plan === currentPlan) return
        setLoading(plan)
        try {
            const res = await apiClient.post("/subscriptions/checkout", { plan })
            const { checkoutUrl } = res.data
            if (checkoutUrl) {
                window.location.href = checkoutUrl
            }
        } catch (err) {
            console.error("Failed to create checkout:", err)
        } finally {
            setLoading(null)
        }
    }

    const planOrder: PlanId[] = ["free", "pro", "business"]

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Choose Your Plan
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Start free, upgrade when you need more repositories
                    and diagram generations.
                </p>
            </div>

            {/* Plan Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {planOrder.map((planId) => {
                    const plan = PLANS[planId]
                    const meta = planMeta[planId]
                    const isCurrent = planId === currentPlan
                    const isPopular = planId === "pro"

                    return (
                        <div
                            key={planId}
                            className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${meta.border} ${isCurrent ? "ring-2 ring-primary" : ""}`}
                        >
                            {isPopular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                                    Most Popular
                                </Badge>
                            )}

                            {isCurrent && (
                                <Badge
                                    variant="outline"
                                    className="absolute top-4 right-4 text-[10px]"
                                >
                                    Current
                                </Badge>
                            )}

                            {/* Icon */}
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} text-white mb-4`}>
                                {meta.icon}
                            </div>

                            {/* Plan Name & Price */}
                            <h2 className="text-xl font-bold">{plan.name}</h2>
                            <div className="mt-2 mb-6">
                                <span className="text-4xl font-bold tracking-tight">
                                    ${plan.price}
                                </span>
                                {plan.price > 0 && (
                                    <span className="text-muted-foreground text-sm ml-1">
                                        / month
                                    </span>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="flex-1 space-y-3 mb-6">
                                {plan.features.map((feature) => {
                                    const isComingSoon = feature.includes("Coming Soon")
                                    return (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2.5 text-sm"
                                        >
                                            {isComingSoon ? (
                                                <Rocket className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                                            ) : (
                                                <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                            )}
                                            <span
                                                className={
                                                    isComingSoon
                                                        ? "text-muted-foreground"
                                                        : ""
                                                }
                                            >
                                                {feature}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>

                            {/* CTA */}
                            {isCurrent ? (
                                <Button
                                    variant="outline"
                                    disabled
                                    className="w-full"
                                >
                                    Current Plan
                                </Button>
                            ) : planId === "free" ? (
                                <Button
                                    variant="ghost"
                                    disabled
                                    className="w-full text-muted-foreground"
                                >
                                    Included
                                </Button>
                            ) : plan.disabled ? (
                                <Button
                                    variant="outline"
                                    disabled
                                    className="w-full text-muted-foreground"
                                >
                                    Coming Soon
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handleUpgrade(planId)}
                                    disabled={loading !== null}
                                    className={`w-full gap-2 ${planId === "business"
                                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
                                        : ""
                                        }`}
                                >
                                    {loading === planId ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4" />
                                    )}
                                    Upgrade to {plan.name}
                                </Button>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* FAQ / Footer Note */}
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                <p>
                    All plans include basic database visualization.
                    Subscriptions are managed through Dodo Payments.
                    You can cancel or change your plan at any time.
                </p>
            </div>
        </div>
    )
}
