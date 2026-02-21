"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Check,
    X,
    Loader2,
    Zap,
    Crown,
    Rocket,
    Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/lib/api/client"
import { PLANS, type PlanId } from "@/lib/utils/subscriptionPlans"

interface UpgradePlanDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentPlan?: PlanId
    triggerReason?: string
}

const planIcons: Record<PlanId, React.ReactNode> = {
    free: <Sparkles className="h-6 w-6" />,
    pro: <Zap className="h-6 w-6" />,
    business: <Crown className="h-6 w-6" />,
}

const planColors: Record<PlanId, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary text-primary-foreground",
    business: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white",
}

export function UpgradePlanDialog({
    open,
    onOpenChange,
    currentPlan = "free",
    triggerReason,
}: UpgradePlanDialogProps) {
    const [loading, setLoading] = useState<PlanId | null>(null)
    const router = useRouter()

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Upgrade Your Plan
                    </DialogTitle>
                    <DialogDescription>
                        {triggerReason ||
                            "Unlock more repositories, diagrams, and features."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-3 mt-2">
                    {planOrder.map((planId) => {
                        const plan = PLANS[planId]
                        const isCurrent = planId === currentPlan
                        const isPopular = planId === "pro"

                        return (
                            <div
                                key={planId}
                                className={`relative flex flex-col rounded-xl border p-5 transition-all ${isCurrent
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "hover:border-primary/50"
                                    } ${isPopular ? "shadow-lg" : ""}`}
                            >
                                {isPopular && (
                                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2">
                                        Most Popular
                                    </Badge>
                                )}

                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${planColors[planId]}`}>
                                    {planIcons[planId]}
                                </div>

                                <h3 className="font-semibold text-lg">
                                    {plan.name}
                                </h3>
                                <div className="mt-1 mb-4">
                                    <span className="text-3xl font-bold">
                                        ${plan.price}
                                    </span>
                                    {plan.price > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            /mo
                                        </span>
                                    )}
                                </div>

                                <ul className="flex-1 space-y-2 mb-4">
                                    {plan.features.map((feature) => {
                                        const isComingSoon = feature.includes("Coming Soon")
                                        return (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-2 text-sm"
                                            >
                                                {isComingSoon ? (
                                                    <Rocket className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                                                ) : (
                                                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                                )}
                                                <span className={isComingSoon ? "text-muted-foreground" : ""}>
                                                    {feature}
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ul>

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
                                        className="w-full"
                                    >
                                        —
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
                                        className={`w-full ${planId === "business"
                                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                                            : ""
                                            }`}
                                    >
                                        {loading === planId ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : null}
                                        Upgrade to {plan.name}
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
