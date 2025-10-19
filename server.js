import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { Octokit } from "@octokit/rest";

// ============================================================================
// Constants & Configuration
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

const GITHUB_TOKEN_PATTERN = /^gh[ps]_[a-zA-Z0-9]{36,}$/;
const ITEMS_PER_PAGE = 100;

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files in production
if (IS_PRODUCTION) {
    app.use(express.static("dist"));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Logs a message with timestamp and optional context
 * @param {string} level - Log level (INFO, ERROR, WARN)
 * @param {string} message - Log message
 * @param {Object} context - Additional context to log
 */
function log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length
        ? ` | ${JSON.stringify(context)}`
        : "";
    console.log(`[${timestamp}] ${level}: ${message}${contextStr}`);
}

/**
 * Validates if a token matches GitHub token format
 * @param {string} token - Token to validate
 * @returns {boolean} - True if valid format
 */
function isValidTokenFormat(token) {
    if (!token || typeof token !== "string") {
        return false;
    }
    return GITHUB_TOKEN_PATTERN.test(token);
}

/**
 * Validates numeric parameter (owner, repo, PR number)
 * @param {string} param - Parameter to validate
 * @param {string} name - Parameter name for error messages
 * @returns {Object} - { valid: boolean, error: string|null }
 */
function validateParam(param, name) {
    if (!param || typeof param !== "string" || param.trim() === "") {
        return { valid: false, error: `${name} is required` };
    }
    return { valid: true, error: null };
}

/**
 * Validates PR/Issue number
 * @param {string} number - Number to validate
 * @returns {Object} - { valid: boolean, error: string|null, value: number }
 */
function validateNumber(number) {
    const num = parseInt(number, 10);
    if (isNaN(num) || num <= 0) {
        return { valid: false, error: "Invalid PR/Issue number", value: null };
    }
    return { valid: true, error: null, value: num };
}

/**
 * Fetches all pages of results from GitHub API
 * @param {Function} method - Octokit method to call
 * @param {Object} params - Parameters for the method
 * @returns {Promise<Array>} - All results combined
 */
async function fetchAll(method, params) {
    const results = [];
    let page = 1;

    try {
        while (true) {
            const { data } = await method({
                ...params,
                per_page: ITEMS_PER_PAGE,
                page,
            });

            results.push(...data);

            // GitHub returns less than per_page items on the last page
            if (data.length < ITEMS_PER_PAGE) {
                break;
            }

            page++;
        }

        log("INFO", `Fetched ${results.length} items across ${page} pages`);
        return results;
    } catch (error) {
        log("ERROR", "Error fetching paginated results", {
            page,
            error: error.message,
        });
        throw error;
    }
}

/**
 * Standardized error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 */
function sendError(res, status, message, details = {}) {
    log("ERROR", message, { status, ...details });
    res.status(status).json({
        error: message,
        ...details,
    });
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Validates GitHub token from request body
 */
function validateToken(req, res, next) {
    const { token } = req.body;

    if (!token) {
        return sendError(res, 401, "Authentication token is required");
    }

    if (!isValidTokenFormat(token)) {
        log("WARN", "Token format validation failed", {
            tokenPrefix: token.substring(0, 4),
        });
        // Still allow it but warn - let GitHub API validate
    }

    next();
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/pr/:owner/:repo/:number
 * Fetches pull request data including comments, reviews, and files
 */
app.post("/api/pr/:owner/:repo/:number", validateToken, async (req, res) => {
    const startTime = Date.now();

    try {
        const { owner, repo, number } = req.params;

        // Validate parameters
        const ownerValidation = validateParam(owner, "owner");
        if (!ownerValidation.valid) {
            return sendError(res, 400, ownerValidation.error);
        }

        const repoValidation = validateParam(repo, "repo");
        if (!repoValidation.valid) {
            return sendError(res, 400, repoValidation.error);
        }

        const numberValidation = validateNumber(number);
        if (!numberValidation.valid) {
            return sendError(res, 400, numberValidation.error);
        }

        log("INFO", "Fetching PR data", {
            owner,
            repo,
            number: numberValidation.value,
        });

        const octokit = new Octokit({ auth: req.body.token });
        const prNumber = numberValidation.value;

        // Fetch all data in parallel
        const [pr, comments, reviewComments, reviews, files] =
            await Promise.all([
                octokit.pulls
                    .get({ owner, repo, pull_number: prNumber })
                    .then((r) => r.data),
                fetchAll(octokit.issues.listComments.bind(octokit.issues), {
                    owner,
                    repo,
                    issue_number: prNumber,
                }),
                fetchAll(octokit.pulls.listReviewComments.bind(octokit.pulls), {
                    owner,
                    repo,
                    pull_number: prNumber,
                }),
                fetchAll(octokit.pulls.listReviews.bind(octokit.pulls), {
                    owner,
                    repo,
                    pull_number: prNumber,
                }),
                fetchAll(octokit.pulls.listFiles.bind(octokit.pulls), {
                    owner,
                    repo,
                    pull_number: prNumber,
                }),
            ]);

        const duration = Date.now() - startTime;
        log("INFO", "PR data fetched successfully", {
            owner,
            repo,
            number: prNumber,
            duration: `${duration}ms`,
            commentCount: comments.length,
            reviewCommentCount: reviewComments.length,
            reviewCount: reviews.length,
            fileCount: files.length,
        });

        res.json({ pr, comments, reviewComments, reviews, files });
    } catch (error) {
        const duration = Date.now() - startTime;

        // Handle specific GitHub API errors
        if (error.status === 401) {
            return sendError(res, 401, "Invalid or expired GitHub token", {
                duration: `${duration}ms`,
            });
        }

        if (error.status === 404) {
            return sendError(
                res,
                404,
                "Pull request not found or access denied",
                { duration: `${duration}ms` },
            );
        }

        if (error.status === 403) {
            return sendError(
                res,
                403,
                "Rate limit exceeded or insufficient permissions",
                { duration: `${duration}ms` },
            );
        }

        // Generic error
        sendError(
            res,
            error.status || 500,
            error.message || "Failed to fetch PR data",
            { duration: `${duration}ms` },
        );
    }
});

/**
 * PATCH /api/comment/:type/:owner/:repo/:id
 * Updates a comment (issue comment or review comment)
 */
app.patch(
    "/api/comment/:type/:owner/:repo/:id",
    validateToken,
    async (req, res) => {
        const startTime = Date.now();

        try {
            const { type, owner, repo, id } = req.params;
            const { body } = req.body;

            // Validate parameters
            if (!["issue", "review"].includes(type)) {
                return sendError(
                    res,
                    400,
                    "Invalid comment type. Must be 'issue' or 'review'",
                );
            }

            const ownerValidation = validateParam(owner, "owner");
            if (!ownerValidation.valid) {
                return sendError(res, 400, ownerValidation.error);
            }

            const repoValidation = validateParam(repo, "repo");
            if (!repoValidation.valid) {
                return sendError(res, 400, repoValidation.error);
            }

            const idValidation = validateNumber(id);
            if (!idValidation.valid) {
                return sendError(res, 400, "Invalid comment ID");
            }

            if (!body || typeof body !== "string" || body.trim() === "") {
                return sendError(res, 400, "Comment body is required");
            }

            log("INFO", "Updating comment", {
                type,
                owner,
                repo,
                commentId: idValidation.value,
            });

            const octokit = new Octokit({ auth: req.body.token });

            const method =
                type === "issue"
                    ? octokit.issues.updateComment
                    : octokit.pulls.updateReviewComment;

            const { data } = await method({
                owner,
                repo,
                comment_id: idValidation.value,
                body: body.trim(),
            });

            const duration = Date.now() - startTime;
            log("INFO", "Comment updated successfully", {
                type,
                owner,
                repo,
                commentId: idValidation.value,
                duration: `${duration}ms`,
            });

            res.json(data);
        } catch (error) {
            const duration = Date.now() - startTime;

            // Handle specific GitHub API errors
            if (error.status === 401) {
                return sendError(res, 401, "Invalid or expired GitHub token", {
                    duration: `${duration}ms`,
                });
            }

            if (error.status === 404) {
                return sendError(
                    res,
                    404,
                    "Comment not found or access denied",
                    { duration: `${duration}ms` },
                );
            }

            if (error.status === 403) {
                return sendError(
                    res,
                    403,
                    "Insufficient permissions to update comment",
                    { duration: `${duration}ms` },
                );
            }

            // Generic error
            sendError(
                res,
                error.status || 500,
                error.message || "Failed to update comment",
                { duration: `${duration}ms` },
            );
        }
    },
);

// ============================================================================
// Health Check Endpoint
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
    });
});

// ============================================================================
// Production SPA Fallback
// ============================================================================

// Serve index.html for all other routes in production (SPA fallback)
if (IS_PRODUCTION) {
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist/index.html"));
    });
}

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
    log("INFO", `Server started successfully`, {
        port: PORT,
        environment: NODE_ENV,
        url: `http://localhost:${PORT}`,
    });
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
    log("INFO", "SIGTERM signal received: closing HTTP server");
    process.exit(0);
});

process.on("SIGINT", () => {
    log("INFO", "SIGINT signal received: closing HTTP server");
    process.exit(0);
});
