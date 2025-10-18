import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

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

/**
 * Renders markdown text to HTML using the marked library with syntax highlighting
 * @param {string} text - Markdown text to render
 * @returns {string} - Rendered HTML string
 */
export function renderMarkdown(text) {
    return marked.parse(text);
}

/**
 * Formats a git diff patch into an HTML table with syntax highlighting
 * Displays line numbers for old and new versions and color-codes additions, deletions, and context
 * @param {string} patch - Git diff patch string to format
 * @returns {string} - HTML table string with formatted diff
 */
export function formatDiff(patch) {
    const lines = patch.split("\n");
    let oldLine = 0; // Track line number in old version
    let newLine = 0; // Track line number in new version
    let html = '<table class="diff-table">';

    for (const line of lines) {
        if (line.startsWith("@@")) {
            // Parse hunk header to get starting line numbers
            // Format: @@ -oldStart,oldLines +newStart,newLines @@
            const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
            if (match) {
                oldLine = parseInt(match[1]);
                newLine = parseInt(match[2]);
            }

            html += ``; // Hunk headers are not displayed in the table
        } else if (line.startsWith("+") && !line.startsWith("+++")) {
            // Handle added lines (exclude file header +++)
            const code = line.slice(1); // Remove the '+' prefix
            html += `
        <tr class="diff-add-row">
          <td class="diff-line-num diff-line-num-old"></td>
          <td class="diff-line-num diff-line-num-new">${newLine}</td>
          <td class="diff-line diff-add"><span>+</span>${highlightLine(
              code,
          )}</td>
        </tr>
      `;
            newLine++;
        } else if (line.startsWith("-") && !line.startsWith("---")) {
            // Handle removed lines (exclude file header ---)
            const code = line.slice(1); // Remove the '-' prefix
            html += `
        <tr class="diff-remove-row">
          <td class="diff-line-num diff-line-num-old">${oldLine}</td>
          <td class="diff-line-num diff-line-num-new"></td>
          <td class="diff-line diff-remove"><span>-</span>${highlightLine(
              code,
          )}</td>
        </tr>
      `;
            oldLine++;
        } else if (!line.startsWith("+++") && !line.startsWith("---")) {
            // Handle context lines (unchanged lines) - exclude file headers
            const code = line.startsWith(" ") ? line.slice(1) : line;
            html += `
        <tr class="diff-context-row">
          <td class="diff-line-num diff-line-num-old">${oldLine || ""}</td>
          <td class="diff-line-num diff-line-num-new">${newLine || ""}</td>
          <td class="diff-line diff-context"><span> </span>${highlightLine(
              code,
          )}</td>
        </tr>
      `;
            // Increment both line counters for context lines
            if (oldLine) oldLine++;
            if (newLine) newLine++;
        }
    }

    html += "</table>";
    return html;
}

/**
 * Highlights a single line of code using highlight.js auto-detection
 * @param {string} code - Code string to highlight
 * @returns {string} - HTML string with syntax highlighting or escaped text if highlighting fails
 */
function highlightLine(code) {
    if (!code.trim()) return "";

    try {
        // Auto-detect language and apply syntax highlighting
        const highlighted = hljs.highlightAuto(code);
        return highlighted.value;
    } catch (err) {
        // If highlighting fails, return escaped text for safety
        return escape(code);
    }
}

/**
 * Escapes HTML entities in text to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - HTML-escaped text
 */
function escape(text) {
    // Use browser's built-in escaping by setting textContent and reading innerHTML
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Groups an array of comments by their file path and sorts them by line number
 * @param {Array<Object>} comments - Array of comment objects with path and line properties
 * @returns {Object} - Object with file paths as keys and sorted comment arrays as values
 */
export function groupByFile(comments) {
    const groups = {};

    // Group comments by file path
    for (const comment of comments) {
        if (!groups[comment.path]) {
            groups[comment.path] = [];
        }
        groups[comment.path].push(comment);
    }

    // Sort comments within each file by line number
    Object.values(groups).forEach((arr) => {
        arr.sort(
            (a, b) =>
                // Use line or original_line property, fallback to 0
                (a.line || a.original_line || 0) -
                (b.line || b.original_line || 0),
        );
    });

    return groups;
}
