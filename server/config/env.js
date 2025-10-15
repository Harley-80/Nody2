import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Exporter les variables d'environnement nécessaires
export const {
    NODE_ENV,
    PORT,
    CLIENT_URL,
    MONGODB_URI,
    JWT_SECRET,
    JWT_EXPIRE,
    EMAIL_SERVICE,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY,
    REDIS_URL,
    UPLOAD_PATH,
    MAX_FILE_SIZE,
    STRIPE_WEBHOOK_SECRET,
} = process.env;

// Valeurs par défaut
export const config = {
    env: NODE_ENV || 'development',
    port: PORT || 5000,
    clientUrl: CLIENT_URL || 'http://localhost:3000',
    mongodbUri: MONGODB_URI || 'mongodb://localhost:27017/nody_ecommerce',
    jwtSecret: JWT_SECRET || 'fallback_secret_change_in_production',
    jwtExpire: JWT_EXPIRE || '30d',
    stripePublishableKey: STRIPE_PUBLISHABLE_KEY,
    stripeSecretKey: STRIPE_SECRET_KEY,
    redisUrl: REDIS_URL || 'redis://localhost:6379',
    uploadPath: UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(MAX_FILE_SIZE) || 10485760,
    stripeWebhookSecret: STRIPE_WEBHOOK_SECRET,
};
