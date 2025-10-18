import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

// Configure marked with syntax highlighting
marked.use(gfmHeadingId());
marked.use(
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        },
    }),
);

marked.setOptions({
    gfm: true,
    breaks: true,
    pedantic: false,
});

export function renderMarkdown(text) {
    return marked.parse(text);
}

export function formatDiff(patch) {
    const lines = patch.split("\n");
    let oldLine = 0;
    let newLine = 0;
    let html = '<table class="diff-table">';

    for (const line of lines) {
        if (line.startsWith("@@")) {
            // Parse hunk header to get line numbers
            const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
            if (match) {
                oldLine = parseInt(match[1]);
                newLine = parseInt(match[2]);
            }

            html += ``;
        } else if (line.startsWith("+") && !line.startsWith("+++")) {
            const code = line.slice(1);
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
            const code = line.slice(1);
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
            if (oldLine) oldLine++;
            if (newLine) newLine++;
        }
    }

    html += "</table>";
    return html;
}

function highlightLine(code) {
    if (!code.trim()) return "";

    try {
        const highlighted = hljs.highlightAuto(code);
        return highlighted.value;
    } catch (err) {
        return escape(code);
    }
}

function escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

export function groupByFile(comments) {
    const groups = {};

    for (const comment of comments) {
        if (!groups[comment.path]) {
            groups[comment.path] = [];
        }
        groups[comment.path].push(comment);
    }

    Object.values(groups).forEach((arr) => {
        arr.sort(
            (a, b) =>
                (a.line || a.original_line || 0) -
                (b.line || b.original_line || 0),
        );
    });

    return groups;
}
