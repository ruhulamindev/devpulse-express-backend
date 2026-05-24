import express, { type Application, type Request, type Response } from "express"
import { pool } from "./db"
import config from "./config/envdot"
import jwt from "jsonwebtoken";
import { authMiddleware, type AuthRequest } from "./middleware/auth.middleware";

const app: Application = express()

app.use(express.json())

// Root directory
app.get('/', (req: Request, res: Response) => {
    // res.send('Hello World!')
    res.status(200).json({
        "success": true,
        "message": "DevPulse Server Running",
        "author": "Ruhul Amin"
    })
})

// User Registration (signup)
app.post("/api/signup", async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    try {
        // allowed roles
        const allowedRoles = ["contributor", "maintainer"];

        // role validation (if provided)
        let userRole = "contributor"; // default

        if (role) {
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role. Must be contributor or maintainer",
                });
            }
            userRole = role;
        }

        const result = await pool.query(
            `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
            [name, email, password, userRole]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result.rows[0],
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error,
        });
    }
});

// User Login
app.post("/api/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        // find user by email
        const result = await pool.query(
            `SELECT * FROM users WHERE email=$1`,
            [email]
        );

        // user not found
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = result.rows[0];

        // password check
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        // create jwt token
        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                role: user.role
            },
            config.jwt_secret as string,
            {
                expiresIn: "7d"
            }
        );

        // success response
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error
        });

    }

});

// create issue route 
app.post("/api/issues", authMiddleware, async (req: AuthRequest, res: Response) => {

    const { title, description, type } = req.body;

    // reporter id
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
    // JWT থেকে reporter id আসবে
    const reporter_id = req.user.id;

    // required check
    if (!title || !description || !type) {
        return res.status(400).json({
            success: false,
            message: "title, description, type required"
        });
    }
    // description length (requirement says min 20 chars)
    if (description.length < 20) {
        return res.status(400).json({
            success: false,
            message: "description must be at least 20 characters"
        });
    }
    // type validation
    if (!["bug", "feature_request"].includes(type)) {
        return res.status(400).json({
            success: false,
            message: "Invalid type. Must be bug or feature_request",
        });
    }

    try {

        const result = await pool.query(
            `INSERT INTO issues
                (title, description, type, reporter_id)
                
                VALUES ($1, $2, $3, $4)

                RETURNING *`,
            [title, description, type, reporter_id]
        );

        res.status(201).json({
            success: true,
            message: "Issue created successfully",
            data: result.rows[0]
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error
        });

    }

}
);

// Get All Issues API
app.get("/api/issues", async (req: Request, res: Response) => {
    try {

        const { sort = "newest", type, status } = req.query;

        // 1. base query
        let query = `SELECT * FROM issues`;
        let conditions: string[] = [];
        let values: any[] = [];

        // 2. filtering (type)
        if (type) {
            values.push(type);
            conditions.push(`type = $${values.length}`);
        }

        // 3. filtering (status)
        if (status) {
            values.push(status);
            conditions.push(`status = $${values.length}`);
        }

        // 4. add WHERE if needed
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }

        // 5. sorting
        if (sort === "oldest") {
            query += ` ORDER BY created_at ASC`;
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        // 6. get issues
        const issuesResult = await pool.query(query, values);
        const issues = issuesResult.rows;

        // 7. get unique reporter ids
        const reporterIds = [...new Set(issues.map(i => i.reporter_id))];

        let reportersMap: any = {};

        if (reporterIds.length > 0) {
            const reporterResult = await pool.query(
                `SELECT id, name, role FROM users WHERE id = ANY($1)`,
                [reporterIds]
            );

            reporterResult.rows.forEach(user => {
                reportersMap[user.id] = user;
            });
        }

        // 8. attach reporter object
        const formattedIssues = issues.map(issue => {
            return {
                id: issue.id,
                title: issue.title,
                description: issue.description,
                type: issue.type,
                status: issue.status,
                reporter: reportersMap[issue.reporter_id] || null,
                created_at: issue.created_at,
                updated_at: issue.updated_at
            };
        });

        // 9. response
        res.status(200).json({
            success: true,
            message: "Issues retrived successfully",
            data: formattedIssues
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error
        });
    }
});

// Get Single Issue API
app.get("/api/issues/:id", async (req: Request, res: Response) => {

    try {
        // issue id
        const { id } = req.params;

        // find issue
        const issueResult = await pool.query(
            `SELECT * FROM issues WHERE id = $1`,
            [id]
        );

        // issue not found
        if (issueResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Issue not found"
            });
        }

        const issue = issueResult.rows[0];

        // find reporter
        const reporterResult = await pool.query(
            `SELECT id, name, role FROM users WHERE id = $1`,
            [issue.reporter_id]
        );

        const reporter = reporterResult.rows[0];

        // formatted response
        const formattedIssue = {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: reporter,
            created_at: issue.created_at,
            updated_at: issue.updated_at
        };

        // success response
        res.status(200).json({
            success: true,
            message: "Issue retrived successfully",
            data: formattedIssue
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error
        });

    }

});

// Update Issue API
app.patch(
    "/api/issues/:id", authMiddleware, async (req: AuthRequest, res: Response) => {

        const issueId = req.params.id;

        const { title, description, type } = req.body;

        try {

            // 1. find issue
            const issueResult = await pool.query(
                `SELECT * FROM issues WHERE id = $1`,
                [issueId]
            );

            // issue not found
            if (issueResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Issue not found"
                });
            }

            const issue = issueResult.rows[0];

            // logged in user
            const user = req.user;

            // 2. maintainer check
            if (user?.role !== "maintainer") {

                // contributor own issue check
                if (user?.id !== issue.reporter_id) {
                    return res.status(403).json({
                        success: false,
                        message: "Forbidden access"
                    });
                }

                // contributor can update only open issue
                if (issue.status !== "open") {
                    return res.status(409).json({
                        success: false,
                        message: "You can update only open issues"
                    });
                }
            }

            // 3. update issue
            const updatedResult = await pool.query(
                `
        UPDATE issues
        SET
          title = $1,
          description = $2,
          type = $3,
          updated_at = NOW()

        WHERE id = $4

        RETURNING *
        `,
                [title, description, type, issueId]
            );

            // 4. response
            res.status(200).json({
                success: true,
                message: "Issue updated successfully",
                data: updatedResult.rows[0]
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: "Something went wrong",
                error
            });

        }

    }
);





export default app