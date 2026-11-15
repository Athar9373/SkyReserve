"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoleMiddleware = exports.authMiddleware = exports.createAuthToken = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../config/db");
const getAuthSecret = () => {
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_TOKEN_SECRET must contain at least 32 characters");
    }
    return secret;
};
const sign = (payload) => (0, crypto_1.createHmac)("sha256", getAuthSecret()).update(payload).digest("base64url");
const createAuthToken = (userId) => {
    const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url");
    return `${payload}.${sign(payload)}`;
};
exports.createAuthToken = createAuthToken;
const getTokenUserId = (token) => {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra !== undefined)
        return undefined;
    const expectedSignature = Buffer.from(sign(payload), "base64url");
    const actualSignature = Buffer.from(signature, "base64url");
    if (actualSignature.length !== expectedSignature.length ||
        !(0, crypto_1.timingSafeEqual)(actualSignature, expectedSignature)) {
        return undefined;
    }
    try {
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (!Number.isSafeInteger(claims.userId) ||
            claims.userId <= 0 ||
            !Number.isSafeInteger(claims.expiresAt) ||
            claims.expiresAt <= Date.now()) {
            return undefined;
        }
        return claims.userId;
    }
    catch {
        return undefined;
    }
};
const authMiddleware = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : "";
    if (!token) {
        return res.status(401).json({ error: "Bearer token required" });
    }
    let userId;
    try {
        userId = getTokenUserId(token);
    }
    catch (err) {
        return next(err);
    }
    if (!userId) {
        return res.status(401).json({ error: "Invalid or expired bearer token" });
    }
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });
        if (!user) {
            return res.status(401).json({ error: "Invalid or expired bearer token" });
        }
        req.userId = user.id;
        req.userRole = user.role;
        return next();
    }
    catch (err) {
        return next(err);
    }
};
exports.authMiddleware = authMiddleware;
const adminRoleMiddleware = (req, res, next) => {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
    }
    return next();
};
exports.adminRoleMiddleware = adminRoleMiddleware;
