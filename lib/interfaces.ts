export enum Stage {
    DEV = 'dev',
    BETA = 'beta',
    GAMMA = 'gamma',
    PROD = 'prod'
}

export interface ServiceAccount {
    name: string;
    awsAccountId: string;
    awsRegion: string;
    stage: Stage;
}

export interface DyondoEnvVars {
    SENDGRID_API_KEY: string;
    JWT_SECRET: string,
    DATABASE_URL: string;
    JWT_ACCOUNT_ACTIVATION: string;
    EMAIL_FROM: string;
    CLIENT_URL: string;
    JWT_RESET_PASSWORD: string;
    GOOGLE_CLIENT_ID: string;
    NODE_ENV: string;
}