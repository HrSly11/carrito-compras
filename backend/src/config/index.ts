import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/carrito_compras',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000,
  },

  bcrypt: {
    saltRounds: 12,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 12,
    maxLimit: 100,
  },

  igvRate: 0.18,
};

export default config;