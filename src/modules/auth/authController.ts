import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "../../config/db";
import { registerSchema, loginSchema } from "./authValidators";
import sendResponse from "../../shared/utils/response";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response) => {
  try {
    const data = await registerSchema.validate(req.body);

    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${data.email}
    `;

    if (existingUser.length > 0) {
      return sendResponse(res, 400, false, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const users = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${data.name}, ${data.email}, ${hashedPassword})
      RETURNING id, name, email
    `;

    const user = users[0];

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return sendResponse(res, 201, true, "User registered successfully", {
      token,
      user,
    });
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await loginSchema.validate(req.body);

    const users = await sql`
      SELECT * FROM users WHERE email = ${data.email}
    `;

    if (users.length === 0) {
      return sendResponse(res, 400, false, "Invalid credentials");
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      return sendResponse(res, 400, false, "Invalid credentials");
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return sendResponse(res, 200, true, "Login successful", {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const me = async (req: any, res: Response) => {
  try {
    const users = await sql`
      SELECT id, name, email FROM users WHERE id = ${req.user.id}
    `;

    if (users.length === 0) {
      return sendResponse(res, 404, false, "User not found");
    }

    return sendResponse(res, 200, true, "User fetched successfully", users[0]);
  } catch (error: any) {
    return sendResponse(res, 500, false, "Server error");
  }
};
