import { pool } from "../../db";
import jwt from "jsonwebtoken";
import config from "../../config/envdot";
import type { LoginServiceInput, LoginServiceResponse, SignupServiceInput } from "./auth.interface";


// SIGNUP SERVICE
export const signupService = async (data: SignupServiceInput) => {
    const { name, email, password, role } = data;

    const allowedRoles = ["contributor", "maintainer"];
    let userRole = "contributor";

    if (role) {
        if (!allowedRoles.includes(role)) {
            throw new Error("Invalid role");
        }
        userRole = role;
    }

    const result = await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, password, userRole]
    );

    return result.rows[0];
};



// LOGIN SERVICE
export const loginService = async (data: LoginServiceInput): Promise<LoginServiceResponse> => {
    const { email, password } = data;

    const result = await pool.query(
        `SELECT * FROM users WHERE email=$1`,
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error("User not found");
    }

    const user = result.rows[0];

    if (password !== user.password) {
        throw new Error("Invalid password");
    }

    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
            role: user.role
        },
        config.jwt_secret as string,
        { expiresIn: "7d" }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at
        }
    };
};