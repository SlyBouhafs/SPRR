<script>
    import { updateComment } from "../api/github.js";
    import { renderMarkdown } from "../utils/markdown.js";
    import DiffView from "./DiffView.svelte";

    let { comment, type, url, files, showToast, showLine = false } = $props();

    let editing = $state(false);
    let editBody = $state(comment.body);
    let currentBody = $state(comment.body);
    let saving = $state(false);
    let edited = $state(false);
    let copied = $state(false);
    let showDiff = $state(false);

    let cssClass = $derived(
        `comment ${type} ${currentBody.toLowerCase().includes(" bad") ? "negative" : "positive"}`
    );

    let metaText = $derived(
        showLine
            ? `Line: ${comment.line || comment.original_line}`
            : type === "general"
              ? `${comment.user?.login || "Unknown"} • ${new Date(comment.created_at).toLocaleString()}`
              : `${comment.user?.login || "Unknown"} • ${comment.state || ""}`
    );

    let canShowDiff = $derived(type === "review" && comment.path);

    let html = $derived(renderMarkdown(currentBody));

    async function copy() {
        await navigator.clipboard.writeText(currentBody);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }

    function startEdit() {
        editing = true;
        editBody = currentBody;
    }

    function cancelEdit() {
        editing = false;
        editBody = currentBody;
    }

    async function save() {
        const newBody = editBody.trim();
        if (!newBody) return alert("Cannot be empty");
        if (newBody === currentBody) return cancelEdit();

        saving = true;
        try {
            await updateComment(url, comment.id, type, newBody);
            currentBody = newBody;
            editing = false;
            edited = true;
            showToast("Updated!", "success");
        } catch (err) {
            showToast(`Error: ${err.message}`, "error");
        } finally {
            saving = false;
        }
    }
</script>

<div class={cssClass}>
    <details open>
        <div class="shortcuts">
            <button class="copy-btn" class:copied onclick={copy} title="Copy">
                <i class="bx bxs-copy"></i>
                {#if copied}<span>Copied!</span>{/if}
            </button>

            <button
                class="edit-btn"
                class:active={editing}
                onclick={startEdit}
                title="Edit"
            >
                <i class="bx bx-edit"></i>
            </button>

            {#if canShowDiff}
                <button
                    class="diff-btn"
                    class:active={showDiff}
                    onclick={() => (showDiff = !showDiff)}
                    title="Diff"
                >
                    <i class="bx {showDiff ? 'bxs-code-alt' : 'bxs-code'}"></i>
                </button>
            {/if}

            <a
                href={comment.html_url}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
            >
                <i class="bx bx-link"></i>
            </a>
        </div>

        <summary class="comment-meta">
            {metaText}
            {#if edited}<span class="edited-badge">(edited)</span>{/if}
        </summary>

        <div class="comment-body">
            {#if editing}
                <textarea
                    class="edit-textarea"
                    bind:value={editBody}
                    spellcheck="true"
                ></textarea>
                <div class="edit-actions">
                    <button
                        title="Save"
                        class="save-btn"
                        onclick={save}
                        disabled={saving}
                    >
                        {#if saving}
                            <i class="bx bx-loader-alt bx-spin"></i>
                        {:else}
                            <i class="bx bxs-save"></i>
                        {/if}
                    </button>
                    <button
                        title="Cancel"
                        class="cancel-btn"
                        onclick={cancelEdit}
                    >
                        <i class="bx bx-x"></i>
                    </button>
                </div>
            {:else}
                {#if showDiff && canShowDiff}
                    <DiffView {comment} {files} />
                {/if}
                <div class="markdown-body">
                    {@html html}
                </div>
            {/if}
        </div>
    </details>
</div>
