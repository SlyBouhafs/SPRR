import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

// ============================================================================
// Constants
// ============================================================================

const CSS_CLASSES = {
    DIFF_TABLE: "diff-table",
    DIFF_ADD_ROW: "diff-add-row",
    DIFF_REMOVE_ROW: "diff-remove-row",
    DIFF_CONTEXT_ROW: "diff-context-row",
    DIFF_LINE_NUM: "diff-line-num",
    DIFF_LINE_NUM_OLD: "diff-line-num-old",
    DIFF_LINE_NUM_NEW: "diff-line-num-new",
    DIFF_LINE: "diff-line",
    DIFF_ADD: "diff-add",
    DIFF_REMOVE: "diff-remove",
    DIFF_CONTEXT: "diff-context",
};

const DIFF_PREFIXES = {
    HUNK: "@@",
    ADD: "+",
    REMOVE: "-",
    FILE_ADD: "+++",
    FILE_REMOVE: "---",
};

const HUNK_PATTERN = /@@ -(\d+),?\d* \+(\d+),?\d* @@/;

// ============================================================================
// Marked Configuration
// ============================================================================

// Configure marked with syntax highlighting
marked.use(gfmHeadingId()); // Enable GitHub Flavored Markdown heading IDs
marked.use(
    markedHighlight({
        langPrefix: "hljs language-", // CSS class prefix for syntax highlighting
        highlight(code, lang) {
            // Use specified language if valid, otherwise fall back to plaintext
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        },
    }),
);

marked.setOptions({
    gfm: true, // Enable GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
    pedantic: false, // Don't conform to original markdown.pl quirks
});

// ============================================================================
// HTML Escaping
// ============================================================================

/**
 * Escapes HTML entities in text to prevent XSS attacks
 * Uses a more efficient Map-based approach
 * @param {string} text - Text to escape
 * @returns {string} - HTML-escaped text
 */
function escapeHtml(text) {
    const htmlEscapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };

    return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

// ============================================================================
// Code Highlighting
// ============================================================================

/**
 * Highlights a single line of code using highlight.js auto-detection
 * @param {string} code - Code string to highlight
 * @returns {string} - HTML string with syntax highlighting or escaped text if highlighting fails
 */
function highlightLine(code) {
    if (!code || !code.trim()) {
        return "";
    }

    try {
        // Auto-detect language and apply syntax highlighting
        const highlighted = hljs.highlightAuto(code);
        return highlighted.value;
    } catch (error) {
        // If highlighting fails, return escaped text for safety
        console.warn("Failed to highlight code:", error);
        return escapeHtml(code);
    }
}

// ============================================================================
// Markdown Rendering
// ============================================================================

/**
 * Renders markdown text to HTML using the marked library with syntax highlighting
 * @param {string} text - Markdown text to render
 * @returns {string} - Rendered HTML string
 * @throws {Error} - If text is not a string
 */
export function renderMarkdown(text) {
    if (typeof text !== "string") {
        throw new Error("renderMarkdown expects a string as input");
    }

    try {
        return marked.parse(text);
    } catch (error) {
        console.error("Failed to render markdown:", error);
        return `<p>Error rendering markdown: ${escapeHtml(error.message)}</p>`;
    }
}

// ============================================================================
// Diff Formatting - Helper Functions
// ============================================================================

/**
 * Parses a hunk header to extract line numbers
 * @param {string} line - Hunk header line (e.g., "@@ -1,5 +1,6 @@")
 * @returns {{oldLine: number, newLine: number} | null} - Parsed line numbers or null
 */
function parseHunkHeader(line) {
    const match = line.match(HUNK_PATTERN);
    if (match) {
        return {
            oldLine: parseInt(match[1], 10),
            newLine: parseInt(match[2], 10),
        };
    }
    return null;
}

/**
 * Checks if a line is a file header
 * @param {string} line - Line to check
 * @returns {boolean} - True if line is a file header (starts with +++ or ---)
 */
function isFileHeader(line) {
    return (
        line.startsWith(DIFF_PREFIXES.FILE_ADD) ||
        line.startsWith(DIFF_PREFIXES.FILE_REMOVE)
    );
}

/**
 * Creates an HTML table row for an added line in diff
 * @param {string} code - Code content without the '+' prefix
 * @param {number} lineNumber - Line number in the new version
 * @returns {string} - HTML string for the row
 */
function createAddedRow(code, lineNumber) {
    return `
        <tr class="${CSS_CLASSES.DIFF_ADD_ROW}">
          <td class="${CSS_CLASSES.DIFF_LINE_NUM} ${CSS_CLASSES.DIFF_LINE_NUM_OLD}"></td>
          <td class="${CSS_CLASSES.DIFF_LINE_NUM} ${CSS_CLASSES.DIFF_LINE_NUM_NEW}">${lineNumber}</td>
          <td class="${CSS_CLASSES.DIFF_LINE} ${CSS_CLASSES.DIFF_ADD}">
            <span>+</span>${highlightLine(code)}
          </td>
        </tr>`;
}

/**
 * Creates an HTML table row for a removed line in diff
 * @param {string} code - Code content without the '-' prefix
 * @param {number} lineNumber - Line number in the old version
 * @returns {string} - HTML string for the row
 */
function createRemovedRow(code, lineNumber) {
    return `
        <tr class="${CSS_CLASSES.DIFF_REMOVE_ROW}">
          <td class="${CSS_CLASSES.DIFF_LINE_NUM} ${CSS_CLASSES.DIFF_LINE_NUM_OLD}">${lineNumber}</td>
          <td class="${CSS_CLASSES.DIFF_LINE_NUM} ${CSS_CLASSES.DIFF_LINE_NUM_NEW}"></td>
          <td class="${CSS_CLASSES.DIFF_LINE} ${CSS_CLASSES.DIFF_REMOVE}">
            <span>-</span>${highlightLine(code)}
          </td>
        </tr>`;
}

/**
 * Creates an HTML table row for a context line in diff
 * @param {string} code - Code content
 * @param {number} oldLine - Line number in old version
 * @param {number} newLine - Line number in new version
 * @returns {string} - HTML string for the row
 */
function createContextRow(code, oldLine, newLine) {
    return `
        <tr class="${CSS_CLASSES.DIFF_CONTEXT_ROW}">
          <td class="${CSS_CLASSES.DIFF_LINE_NUM} ${CSS_CLASSES.DIFF_LINE_NUM_OLD}">${oldLine || ""}</td>
          <td class="${CSS_CLASSES.DIFF_LINE_NUM} ${CSS_CLASSES.DIFF_LINE_NUM_NEW}">${newLine || ""}</td>
          <td class="${CSS_CLASSES.DIFF_LINE} ${CSS_CLASSES.DIFF_CONTEXT}">
            <span> </span>${highlightLine(code)}
          </td>
        </tr>`;
}

/**
 * Processes a single line from a diff patch
 * @param {string} line - Single line from diff
 * @param {Object} state - Current state with oldLine and newLine counters
 * @returns {string} - HTML string for the line (may be empty for hunk headers)
 */
function processDiffLine(line, state) {
    // Handle hunk headers
    if (line.startsWith(DIFF_PREFIXES.HUNK)) {
        const parsed = parseHunkHeader(line);
        if (parsed) {
            state.oldLine = parsed.oldLine;
            state.newLine = parsed.newLine;
        }
        return ""; // Hunk headers are not displayed in the table
    }

    // Handle added lines (exclude file header +++)
    if (
        line.startsWith(DIFF_PREFIXES.ADD) &&
        !line.startsWith(DIFF_PREFIXES.FILE_ADD)
    ) {
        const code = line.slice(1); // Remove the '+' prefix
        const row = createAddedRow(code, state.newLine);
        state.newLine++;
        return row;
    }

    // Handle removed lines (exclude file header ---)
    if (
        line.startsWith(DIFF_PREFIXES.REMOVE) &&
        !line.startsWith(DIFF_PREFIXES.FILE_REMOVE)
    ) {
        const code = line.slice(1); // Remove the '-' prefix
        const row = createRemovedRow(code, state.oldLine);
        state.oldLine++;
        return row;
    }

    // Handle context lines (unchanged lines) - exclude file headers
    if (!isFileHeader(line)) {
        const code = line.startsWith(" ") ? line.slice(1) : line;
        const row = createContextRow(code, state.oldLine, state.newLine);
        // Increment both line counters for context lines
        if (state.oldLine) state.oldLine++;
        if (state.newLine) state.newLine++;
        return row;
    }

    return "";
}

// ============================================================================
// Diff Formatting - Main Function
// ============================================================================

/**
 * Formats a git diff patch into an HTML table with syntax highlighting
 * Displays line numbers for old and new versions and color-codes additions, deletions, and context
 * @param {string} patch - Git diff patch string to format
 * @returns {string} - HTML table string with formatted diff
 * @throws {Error} - If patch is not a string
 */
export function formatDiff(patch) {
    if (typeof patch !== "string") {
        throw new Error("formatDiff expects a string as input");
    }

    if (!patch.trim()) {
        return `<p>No diff available</p>`;
    }

    const lines = patch.split("\n");
    const state = {
        oldLine: 0, // Track line number in old version
        newLine: 0, // Track line number in new version
    };

    const rows = lines.map((line) => processDiffLine(line, state)).join("");

    return `<table class="${CSS_CLASSES.DIFF_TABLE}">${rows}</table>`;
}

// ============================================================================
// Comment Grouping
// ============================================================================

/**
 * Gets the line number from a comment, preferring 'line' over 'original_line'
 * @param {Object} comment - Comment object
 * @returns {number} - Line number (0 if not found)
 */
function getCommentLineNumber(comment) {
    return comment?.line || comment?.original_line || 0;
}

/**
 * Groups an array of comments by their file path and sorts them by line number
 * Uses a more modern reduce approach for better functional style
 * @param {Array<Object>} comments - Array of comment objects with path and line properties
 * @returns {Object} - Object with file paths as keys and sorted comment arrays as values
 * @throws {Error} - If comments is not an array
 */
export function groupByFile(comments) {
    if (!Array.isArray(comments)) {
        throw new Error("groupByFile expects an array as input");
    }

    // Group comments by file path using reduce
    const groups = comments.reduce((acc, comment) => {
        const path = comment?.path;
        if (!path) {
            console.warn("Comment missing path property:", comment);
            return acc;
        }

        if (!acc[path]) {
            acc[path] = [];
        }
        acc[path].push(comment);
        return acc;
    }, {});

    // Sort comments within each file by line number
    Object.keys(groups).forEach((path) => {
        groups[path].sort((a, b) => {
            return getCommentLineNumber(a) - getCommentLineNumber(b);
        });
    });

    return groups;
}
