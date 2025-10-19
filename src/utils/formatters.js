import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

// ============================================================================
// Constants
// ============================================================================

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

// ============================================================================
// Diff Formatting
// ============================================================================

/**
 * Safely splits highlighted HTML into lines without breaking span tags
 * @param {string} html - Highlighted HTML string
 * @returns {Array<string>} - Array of HTML strings, one per line
 */
function splitHighlightedHtml(html) {
    const lines = [];
    let currentLine = "";
    let tagStack = [];
    let i = 0;

    while (i < html.length) {
        const char = html[i];

        if (char === "\n") {
            // Close any open tags before the newline
            for (let j = tagStack.length - 1; j >= 0; j--) {
                currentLine += "</span>";
            }
            lines.push(currentLine);
            currentLine = "";
            // Reopen tags for the next line
            for (const tag of tagStack) {
                currentLine += tag;
            }
            i++;
        } else if (char === "<") {
            // Check if this is a tag
            const tagMatch = html.slice(i).match(/^<(\/?span[^>]*)>/);
            if (tagMatch) {
                const fullTag = tagMatch[0];
                const tagContent = tagMatch[1];
                currentLine += fullTag;

                if (tagContent.startsWith("/")) {
                    // Closing tag
                    tagStack.pop();
                } else {
                    // Opening tag
                    tagStack.push(fullTag);
                }

                i += fullTag.length;
            } else {
                currentLine += char;
                i++;
            }
        } else {
            currentLine += char;
            i++;
        }
    }

    // Add the last line if there's content
    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

/**
 * Formats a Git diff patch into an HTML table with syntax highlighting
 * @param {string} patch - Git diff patch string
 * @returns {string} - HTML string containing the formatted diff table
 */
export function formatDiffForTable(patch) {
    if (!patch) {
        return '<p class="no-diff">No diff available</p>';
    }

    const lines = patch.split("\n");

    // First pass: collect all code lines and their types
    const codeLines = [];
    const lineTypes = [];
    let oldLine = 0;
    let newLine = 0;
    const lineNumbers = [];

    for (const line of lines) {
        // Parse hunk header
        if (line.startsWith("@@")) {
            const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
            if (match) {
                oldLine = parseInt(match[1], 10);
                newLine = parseInt(match[2], 10);
            }
            continue;
        }

        // Skip file headers
        if (line.startsWith("+++") || line.startsWith("---")) {
            continue;
        }

        // Determine line type and extract code
        let type, code;
        if (line.startsWith("+")) {
            type = "add";
            code = line.slice(1);
            lineNumbers.push({ old: "", new: newLine });
            newLine++;
        } else if (line.startsWith("-")) {
            type = "remove";
            code = line.slice(1);
            lineNumbers.push({ old: oldLine, new: "" });
            oldLine++;
        } else {
            type = "context";
            code = line.startsWith(" ") ? line.slice(1) : line;
            lineNumbers.push({ old: oldLine || "", new: newLine || "" });
            if (oldLine) oldLine++;
            if (newLine) newLine++;
        }

        codeLines.push(code);
        lineTypes.push(type);
    }

    // Second pass: highlight the entire code block using auto-detection
    let highlightedLines;
    if (codeLines.length > 0) {
        const fullCode = codeLines.join("\n");

        try {
            // Use highlight.js's built-in language detection
            const highlighted = hljs.highlightAuto(fullCode).value;
            highlightedLines = splitHighlightedHtml(highlighted);
        } catch (error) {
            console.warn(
                "Syntax highlighting failed, using plain text:",
                error,
            );
            highlightedLines = codeLines.map(escapeHtml);
        }
    } else {
        highlightedLines = [];
    }

    // Third pass: build the HTML table
    let html = '<table class="diff-table">';

    for (let i = 0; i < highlightedLines.length; i++) {
        const type = lineTypes[i];
        const code = highlightedLines[i];
        const nums = lineNumbers[i];

        if (type === "add") {
            html += `<tr class="diff-add-row">`;
            html += `<td class="diff-line-num diff-line-num-old"></td>`;
            html += `<td class="diff-line-num diff-line-num-new">${nums.new}</td>`;
            html += `<td class="diff-line diff-add"><span class="add">+</span>${code}</td>`;
            html += `</tr>`;
        } else if (type === "remove") {
            html += `<tr class="diff-remove-row">`;
            html += `<td class="diff-line-num diff-line-num-old">${nums.old}</td>`;
            html += `<td class="diff-line-num diff-line-num-new"></td>`;
            html += `<td class="diff-line diff-remove"><span class="rem">-</span>${code}</td>`;
            html += `</tr>`;
        } else {
            html += `<tr class="diff-context-row">`;
            html += `<td class="diff-line-num diff-line-num-old">${nums.old}</td>`;
            html += `<td class="diff-line-num diff-line-num-new">${nums.new}</td>`;
            html += `<td class="diff-line diff-context"><span> </span>${code}</td>`;
            html += `</tr>`;
        }
    }

    html += "</table>";
    return html;
}
