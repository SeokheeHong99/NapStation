import { PrismaClient } from "@prisma/client";

// Amplify Lambda fix: next.config `env` bakes DATABASE_URL into the bundle at
// build time via webpack string substitution. Prisma reads from the real
// process.env (node_modules are not bundled), so we read the substituted
// literal into a variable and write it back into the actual process.env.
const _dbUrl = process.env.DATABASE_URL; // webpack replaces this read with the literal
if (_dbUrl) process.env.DATABASE_URL = _dbUrl; // write literal into real process.env

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
