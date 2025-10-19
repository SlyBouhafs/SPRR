<script>
    import { formatDiffForTable } from "../utils/formatters.js";

    let { comment, files } = $props();

    /**
     * Computed diff HTML using the formatter utility
     */
    const diffHtml = $derived(() => {
        const file = files?.find((f) => f.filename === comment.path);
        const patch = comment.diff_hunk || file?.patch || "";

        return formatDiffForTable(patch);
    });
</script>

<div class="diff-viewer">
    <div class="diff-content">
        {@html diffHtml()}
    </div>
</div>
