"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const authMiddleware_1 = require("../middleware/authMiddleware");
const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;
        const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                error: "Email already exists",
                message: "Registration failed. Email is already in use.",
                status: 400,
                validationErrors: { email: "Email is already taken" },
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await db_1.prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phoneNumber,
                password: hashedPassword,
            },
        });
        return res.status(201).json({
            userId: user.id,
            role: user.role,
            token: (0, authMiddleware_1.createAuthToken)(user.id),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Invalid email or password",
                status: 401,
            });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Invalid email or password",
                status: 401,
            });
        }
        return res.json({
            userId: user.id,
            role: user.role,
            token: (0, authMiddleware_1.createAuthToken)(user.id),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
