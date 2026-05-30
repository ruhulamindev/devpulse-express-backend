// CREATE ISSUE
export interface CreateIssueInput {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}

// ISSUE DB MODEL
export interface Issue {
  id: number;
  title: string;
  description: string;
  type: "bug" | "feature_request";
  status: "open" | "in_progress" | "resolved";
  reporter_id: number;
  created_at: string;
  updated_at: string;
};

// UPDATE INPUT
export interface UpdateIssueInput {
  title?: string;
  description?: string;
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
};

// QUERY FILTERS
export interface IssueQuery {
  sort?: "newest" | "oldest";
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
};
