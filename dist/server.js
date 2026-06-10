

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express3 from "express";

// src/modules/auth/auth.routes.ts
import express from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/envdot.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var envdot_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: envdot_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'contributor',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
      )`);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
            id SERIAL PRIMARY KEY,

            title VARCHAR(150) NOT NULL,

            description TEXT NOT NULL,

            type VARCHAR(30) NOT NULL,

            status VARCHAR(30) DEFAULT 'open',

            reporter_id INTEGER NOT NULL,

            created_at TIMESTAMP DEFAULT NOW(),

            updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
    console.log("Database connected successfully!!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
var signupService = async (data) => {
  const { name, email, password, role } = data;
  const allowedRoles = ["contributor", "maintainer"];
  let userRole = "contributor";
  if (role) {
    if (!allowedRoles.includes(role)) {
      throw new Error("Invalid role");
    }
    userRole = role;
  }
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, userRole]
  );
  return result.rows[0];
};
var loginService = async (data) => {
  const { email, password } = data;
  const result = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );
  if (result.rows.length === 0) {
    throw new Error("User not found");
  }
  const user = result.rows[0];
  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );
  if (!isPasswordMatched) {
    throw new Error("Invalid password");
  }
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role
    },
    envdot_default.jwt_secret,
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

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data
  });
};

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await signupService({ name, email, password, role });
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
};
var loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await loginService({ email, password });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data
    });
  } catch (error) {
    next(error);
  }
};

// src/modules/auth/auth.routes.ts
var router = express.Router();
router.post("/signup", signupUser);
router.post("/login", loginUser);
var auth_routes_default = router;

// src/modules/issues/issues.routes.ts
import express2 from "express";

// src/modules/issues/issues.service.ts
var createIssueService = async (data, userId) => {
  const { title, description, type } = data;
  if (!title || !description || !type) {
    throw new Error("title, description, type required");
  }
  if (title.length > 150) {
    throw new Error("Title must be maximum 150 characters");
  }
  if (description.length < 20) {
    throw new Error(
      "description must be at least 20 characters"
    );
  }
  if (!["bug", "feature_request"].includes(type)) {
    throw new Error(
      "Invalid type. Must be bug or feature_request"
    );
  }
  const result = await pool.query(
    `
      INSERT INTO issues
      (title, description, type, reporter_id)

      VALUES ($1, $2, $3, $4)

      RETURNING *
    `,
    [title, description, type, userId]
  );
  return result.rows[0];
};
var getAllIssuesService = async (query) => {
  const { sort = "newest", type, status } = query;
  let sql = `SELECT * FROM issues`;
  let conditions = [];
  let values = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }
  sql += sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;
  const issuesResult = await pool.query(sql, values);
  const issues = issuesResult.rows;
  const reporterIds = [
    ...new Set(issues.map((i) => i.reporter_id))
  ];
  let reportersMap = {};
  if (reporterIds.length > 0) {
    const reporterResult = await pool.query(
      `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1)
      `,
      [reporterIds]
    );
    reporterResult.rows.forEach((user) => {
      reportersMap[user.id] = user;
    });
  }
  const formattedIssues = issues.map((issue) => {
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
  return formattedIssues;
};
var getSingleIssueService = async (req) => {
  const { id } = req.params;
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id = $1
    `,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueService = async (req) => {
  const issueId = req.params.id;
  const { title, description, type, status } = req.body;
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [issueId]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const user = req.user;
  if (user?.role !== "maintainer") {
    if (user?.id !== issue.reporter_id) {
      throw new Error("Forbidden access");
    }
    if (issue.status !== "open") {
      throw new Error(
        "You can update only open issues"
      );
    }
  }
  if (user?.role !== "maintainer" && status !== void 0) {
    throw new Error(
      "Only maintainer can change issue status"
    );
  }
  if (status && !["open", "in_progress", "resolved"].includes(status)) {
    throw new Error("Invalid status");
  }
  const updatedResult = await pool.query(
    `
      UPDATE issues
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        status = COALESCE($4, status),
        updated_at = NOW()

      WHERE id = $5

      RETURNING *
    `,
    [title, description, type, status, issueId]
  );
  return updatedResult.rows[0];
};
var deleteIssueService = async (req) => {
  const issueId = req.params.id;
  if (req.user?.role !== "maintainer") {
    throw new Error(
      "Only maintainer can delete issues"
    );
  }
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [issueId]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  await pool.query(
    `DELETE FROM issues WHERE id = $1`,
    [issueId]
  );
  return true;
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res, next) => {
  try {
    const result = await createIssueService(req.body, req.user.id);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  try {
    const result = await getAllIssuesService(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleIssue = async (req, res, next) => {
  try {
    const result = await getSingleIssueService(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  try {
    const result = await updateIssueService(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  try {
    await deleteIssueService(req);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    const decoded = jwt2.verify(
      token,
      envdot_default.jwt_secret
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

// src/modules/issues/issues.routes.ts
var router2 = express2.Router();
router2.post("/", authMiddleware, createIssue);
router2.get("/", getAllIssues);
router2.get("/:id", getSingleIssue);
router2.patch("/:id", authMiddleware, updateIssue);
router2.delete("/:id", authMiddleware, deleteIssue);
var issues_routes_default = router2;

// src/middleware/error.middleware.ts
var globalErrorHandler = (error, req, res, next) => {
  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

// src/app.ts
var app = express3();
app.use(express3.json());
app.get("/", (req, res) => {
  res.status(200).json({
    "success": true,
    "message": "DevPulse Server Running",
    "author": "Ruhul Amin"
  });
});
app.use("/api/auth", auth_routes_default);
app.use("/api/issues", issues_routes_default);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(envdot_default.port, () => {
    console.log(`Example app listening on port ${envdot_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map