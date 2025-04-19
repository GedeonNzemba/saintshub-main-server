// src/config/index.ts

// Removed dotenv loading - moved to server.ts

// Helper function to get required env var or throw error
const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Helper function to get optional env var or return default
const getOptionalEnvVar = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * Application Configuration
 */
const config = {
  get nodeEnv() { return getOptionalEnvVar('NODE_ENV', 'development'); },
  get isProduction() { return process.env['NODE_ENV'] === 'production'; },
  get isDevelopment() { return process.env['NODE_ENV'] !== 'production'; },
  get port() { return parseInt(getOptionalEnvVar('PORT', '3003'), 10); },

  database: {
    get mongodbUri() { return getRequiredEnvVar('MONGODB_URI'); },
  },

  jwt: {
    get secret() { return getRequiredEnvVar('JWT_SECRET'); },
    get expiresIn() { return '1d'; }, // Example: token expiry time
  },

  mail: {
    // Use production settings if NODE_ENV is production, otherwise use staging
    get host() { 
      return process.env['NODE_ENV'] === 'production'
        ? getRequiredEnvVar('MAILTRAP_PROD_HOST')
        : getRequiredEnvVar('MAILTRAP_HOST');
    },
    get port() {
      return parseInt(
        process.env['NODE_ENV'] === 'production'
          ? getRequiredEnvVar('MAILTRAP_PROD_PORT')
          : getRequiredEnvVar('MAILTRAP_PORT'),
        10
      );
    },
    get user() {
      return process.env['NODE_ENV'] === 'production'
        ? getRequiredEnvVar('MAILTRAP_PROD_USER')
        : getRequiredEnvVar('MAILTRAP_USER');
    },
    get pass() {
      return process.env['NODE_ENV'] === 'production'
        ? getRequiredEnvVar('MAILTRAP_PROD_PASS')
        : getRequiredEnvVar('MAILTRAP_PASS');
    },
    get fromNoReply() { return getRequiredEnvVar('EMAIL_FROM_NOREPLY'); },
    get fromAdmin() { return getRequiredEnvVar('EMAIL_FROM_ADMIN'); },
    get adminNotificationEmail() { return getRequiredEnvVar('ADMIN_NOTIFICATION_EMAIL'); },
  },

  brand: {
    get logoUrl() { return getRequiredEnvVar('BRAND_LOGO_URL'); },
    get colorPrimary() { return getRequiredEnvVar('BRAND_COLOR_PRIMARY'); },
    get colorSecondary() { return getRequiredEnvVar('BRAND_COLOR_SECONDARY'); },
    get websiteUrl() { return getRequiredEnvVar('BRAND_WEBSITE_URL'); },
    get appUrl() { return getRequiredEnvVar('BRAND_APP_URL'); },
    get dashboardUrl() { return getRequiredEnvVar('BRAND_DASHBOARD_URL'); },
  },

  // Add other configurations as needed (e.g., CORS origins, rate limit settings)
  cors: {
    get origin() { return process.env['CORS_ORIGIN'] || '*'; } // Be more specific in production!
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
};

export default config;
