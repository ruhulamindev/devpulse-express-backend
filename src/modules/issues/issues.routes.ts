import express from "express";
import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
} from "./issues.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

// Create Issue
router.post("/", authMiddleware, createIssue);

// Get All Issues
router.get("/", getAllIssues);

// Get Single Issue
router.get("/:id", getSingleIssue);

// Update Issue
router.patch("/:id", authMiddleware, updateIssue);

// Delete Issue
router.delete("/:id", authMiddleware, deleteIssue);

export default router;