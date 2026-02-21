const envConfig = {
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubCallbackUrl: process.env.GITHUB_CALLBACK_URL,
    mongoDbUri: process.env.MONGODB_URI,
    dodoPaymentsKey: process.env.DODO_PAYMENTS_KEY,
    proProductId: process.env.PRO_PRODUCT_ID || process.env.SUBSCRIPTION_PRODUCT_ID,
    businessProductId: process.env.BUSINESS_PRODUCT_ID || process.env.SUBSCRIPTION_PRODUCT_ID,
    dodoWebhookSecret: process.env.DODO_WEBHOOK_SECRET || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

export default envConfig;