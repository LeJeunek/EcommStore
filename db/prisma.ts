// db/prisma.ts

import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Required for serverless environments
neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });

// FIX: Cast pool to any to bypass the incompatible PoolConfig type check
const adapter = new PrismaNeon(pool as any); 

export const prisma = new PrismaClient({ adapter }).$extends({
  result: {
    product: {
      price: {
        compute(product) {
          return product.price.toString();
        },
      },
      rating: {
        compute(product) {
          return product.rating.toString();
        },
      },
    },
  },
});