export type PlanId = 'free' | 'pro' | 'business';

export interface PlanDefinition {
    id: PlanId;
    name: string;
    price: number; // USD per month
    repoLimit: number; // -1 for unlimited
    diagramsPerDay: number; // -1 for unlimited
    hasCiCd: boolean;
    ciCdComingSoon: boolean;
    disabled: boolean; // Plan visible but not purchasable
    features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        repoLimit: 1,
        diagramsPerDay: 1,
        hasCiCd: false,
        ciCdComingSoon: false,
        disabled: false,
        features: [
            'Connect 1 repository',
            '1 diagram generation per day',
            'Basic database visualization',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 10,
        repoLimit: 10,
        diagramsPerDay: 20,
        hasCiCd: false,
        ciCdComingSoon: false,
        disabled: false,
        features: [
            'Connect up to 10 repositories',
            '20 diagram generations per day',
            'Advanced database visualization',
            'Priority support',
        ],
    },
    business: {
        id: 'business',
        name: 'Business',
        price: 29,
        repoLimit: -1,
        diagramsPerDay: -1,
        hasCiCd: false,
        ciCdComingSoon: true,
        disabled: true,
        features: [
            'Unlimited repositories',
            'Unlimited diagram generations',
            'CI/CD Integration (Coming Soon)',
            'Team collaboration',
            'Priority support',
        ],
    },
};

export function getPlanLimits(plan: PlanId) {
    return PLANS[plan] || PLANS.free;
}
