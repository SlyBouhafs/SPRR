<script>
    import { groupByFile } from "../utils/markdown.js";
    import CommentItem from "./CommentItem.svelte";

    let {
        title,
        comments,
        type,
        url,
        files,
        showToast,
        groupByFile: shouldGroup = false,
    } = $props();

    let open = $state(true);

    let grouped = $derived(shouldGroup ? groupByFile(comments) : null);
    let fileKeys = $derived(grouped ? Object.keys(grouped).sort() : null);
</script>

{#if comments.length > 0}
    <section class="comment-section">
        <details bind:open>
            <summary class="section-header">
                {title}
                <span class="count">{comments.length}</span>
            </summary>

            {#if grouped && fileKeys}
                {#each fileKeys as filePath}
                    {@const fileComments = grouped[filePath]}
                    <div class="file-group">
                        <details open>
                            <summary class="file-header">
                                <span class="file-path">
                                    {filePath.length > 50
                                        ? "..." + filePath.slice(-47)
                                        : filePath}
                                    <span class="count"
                                        >{fileComments.length}</span
                                    >
                                </span>
                            </summary>
                            <div>
                                {#each fileComments as comment (comment.id)}
                                    <CommentItem
                                        {comment}
                                        {type}
                                        {url}
                                        {files}
                                        {showToast}
                                        showLine
                                    />
                                {/each}
                            </div>
                        </details>
                    </div>
                {/each}
            {:else}
                <div>
                    {#each comments as comment (comment.id)}
                        <CommentItem
                            {comment}
                            {type}
                            {url}
                            {files}
                            {showToast}
                        />
                    {/each}
                </div>
            {/if}
        </details>
    </section>
{/if}
