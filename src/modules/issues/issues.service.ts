import { pool } from "../../db";
import type { Request } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";


// Create Issue Service
export const createIssueService = async (
  req: AuthRequest
) => {

  const { title, description, type } = req.body;

  // reporter id
  if (!req.user?.id) {
    throw new Error("Unauthorized");
  }

  const reporter_id = req.user.id;

  // validation
  if (!title || !description || !type) {
    throw new Error("title, description, type required");
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
    [title, description, type, reporter_id]
  );

  return result.rows[0];
};



// Get All Issues Service
export const getAllIssuesService = async (
  req: Request
) => {

  const { sort = "newest", type, status } = req.query;

  let query = `SELECT * FROM issues`;

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
    query += ` WHERE ` + conditions.join(" AND ");
  }

  // sorting
  if (sort === "oldest") {
    query += ` ORDER BY created_at ASC`;
  } else {
    query += ` ORDER BY created_at DESC`;
  }

  // get issues
  const issuesResult = await pool.query(query, values);

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

  const { title, description, type } = req.body;

  // find issue
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [issueId]
  );

  // not found
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

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

  // update query
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