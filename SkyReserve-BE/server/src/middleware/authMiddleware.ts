import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/db";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: UserRole;
    }
  }
}

const getAuthSecret = () => {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_TOKEN_SECRET must contain at least 32 characters");
  }
  return secret;
};

const sign = (payload: string) =>
  createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");

export const createAuthToken = (userId: number) => {
  const payload = Buffer.from(
    JSON.stringify({ userId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const getTokenUserId = (token: string): number | undefined => {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return undefined;

  const expectedSignature = Buffer.from(sign(payload), "base64url");
  const actualSignature = Buffer.from(signature, "base64url");
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return undefined;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { userId?: unknown; expiresAt?: unknown };
    if (
      !Number.isSafeInteger(claims.userId) ||
      (claims.userId as number) <= 0 ||
      !Number.isSafeInteger(claims.expiresAt) ||
      (claims.expiresAt as number) <= Date.now()
    ) {
      return undefined;
    }
    return claims.userId as number;
  } catch {
    return undefined;
  }
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) {
    return res.status(401).json({ error: "Bearer token required" });
  }

  let userId: number | undefined;
  try {
    userId = getTokenUserId(token);
  } catch (err) {
    return next(err);
  }
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired bearer token" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired bearer token" });
    }
    req.userId = user.id;
    req.userRole = user.role;
    return next();
  } catch (err) {
    return next(err);
  }
};

export const adminRoleMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
};
