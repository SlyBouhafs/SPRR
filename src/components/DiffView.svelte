<script>
    import { formatDiff } from "../utils/formatters.js";
    import { slide } from "svelte/transition";

    let { comment, files } = $props();

    let file = $derived(files?.find((f) => f.filename === comment.path));
    let patch = $derived(comment.diff_hunk || file?.patch || "");
    let html = $derived(patch ? formatDiff(patch) : "<p>No diff</p>");
</script>

<div transition:slide class="diff-viewer">
    <div class="diff-content">
        {@html html}
    </div>
</div>
