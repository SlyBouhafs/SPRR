<script>
    let { pr, refreshing } = $props();
</script>

<div class="pr-info">
    <div class="pr-header">
        <div class="flex">
            <a
                title="Github"
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
            >
                <i class="bx bx-git-pull-request"></i></a
            >
            <h3>{pr.title}</h3>
        </div>
        <span class="count">{pr.comments + pr.review_comments}</span>
        <i
            class={!refreshing ? "" : "bx bx-loader-dots bx-spin active"}
            title="Auto-refreshing every 30s"
        ></i>
    </div>
    <div class="changes">
        <p>
            {pr.changed_files <= 1
                ? pr.changed_files + " file"
                : pr.changed_files + " files"} changed
        </p>
        <div class="lines">
            <p>
                <span class="add"> +{pr.additions}</span>
                <span class="rem"> -{pr.deletions}</span>
            </p>
            <p class="blocks">
                {#if pr.additions >= pr.deletions}
                    <i class="bx bxs-square add"></i>
                    <i class="bx bxs-square add"></i>
                    <i class="bx bxs-square rem"></i>
                {:else}
                    <i class="bx bxs-square add"></i>
                    <i class="bx bxs-square rem"></i>
                    <i class="bx bxs-square rem"></i>
                {/if}
            </p>
        </div>
    </div>
</div>
