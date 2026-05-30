import { pool } from "../../db";
import type { Request } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";
import type { CreateIssueInput, Issue, IssueQuery, UpdateIssueInput } from "./issue.interface";

// Create Issue Service
export const createIssueService = async (data: CreateIssueInput, userId: number) => {

    const { title, description, type } = data;

    // validation
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

    // query
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

// Get All Issues Service
export const getAllIssuesService = async (query: IssueQuery) => {

    const { sort = "newest", type, status } = query;

    let sql = `SELECT * FROM issues`;
    let conditions: string[] = [];
    let values: any[] = [];

    // type filter
    if (type) {
        values.push(type);
        conditions.push(`type = $${values.length}`);
    }

    // status filter
    if (status) {
        values.push(status);
        conditions.push(`status = $${values.length}`);
    }

    // WHERE
    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(" AND ");
    }

    // sorting
    sql += sort === "oldest"
        ? ` ORDER BY created_at ASC`
        : ` ORDER BY created_at DESC`;

    // get issues
    const issuesResult = await pool.query(sql, values);

    const issues = issuesResult.rows;

    // unique reporter ids
    const reporterIds = [
        ...new Set(issues.map(i => i.reporter_id))
    ];

    let reportersMap: any = {};

    if (reporterIds.length > 0) {

        const reporterResult = await pool.query(
            `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1)
      `,
            [reporterIds]
        );

        reporterResult.rows.forEach(user => {
            reportersMap[user.id] = user;
        });
    }

    // formatted response
    const formattedIssues = issues.map(issue => {
        return {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter:
                reportersMap[issue.reporter_id] || null,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
        };
    });

    return formattedIssues;
};

// Get Single Issue Service
export const getSingleIssueService = async (
    req: Request
) => {

    const { id } = req.params;

    // find issue
    const issueResult = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [id]
    );

    // not found
    if (issueResult.rows.length === 0) {
        throw new Error("Issue not found");
    }

    const issue = issueResult.rows[0];

    // reporter
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
        updated_at: issue.updated_at,
    };
};

// Update Issue Service
export const updateIssueService = async (
    req: AuthRequest
) => {

    const issueId = req.params.id;

    const { title, description, type, status } = req.body as UpdateIssueInput;

    // find issue
    const issueResult = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [issueId]
    );

    // not found
    if (issueResult.rows.length === 0) {
        throw new Error("Issue not found");
    }

    const issue: Issue = issueResult.rows[0];

    const user = req.user;

    // maintainer check
    if (user?.role !== "maintainer") {

        // own issue check
        if (user?.id !== issue.reporter_id) {
            throw new Error("Forbidden access");
        }

        // only open issue update
        if (issue.status !== "open") {
            throw new Error(
                "You can update only open issues"
            );
        }
    }

    // contributor status change করতে পারবে না
    if (
        user?.role !== "maintainer" &&
        status !== undefined
    ) {
        throw new Error(
            "Only maintainer can change issue status"
        );
    }

    // valid status check
    if (
        status &&
        !["open", "in_progress", "resolved"].includes(status)
    ) {
        throw new Error("Invalid status");
    }

    // update query
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

// Delete Issue Service
export const deleteIssueService = async (
    req: AuthRequest
) => {

    const issueId = req.params.id;

    // only maintainer
    if (req.user?.role !== "maintainer") {
        throw new Error(
            "Only maintainer can delete issues"
        );
    }

    // check issue
    const issueResult = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [issueId]
    );

    if (issueResult.rows.length === 0) {
        throw new Error("Issue not found");
    }

    // delete
    await pool.query(
        `DELETE FROM issues WHERE id = $1`,
        [issueId]
    );

    return true;
};
