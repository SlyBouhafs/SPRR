<script>
    import { pluralize } from "../utils/helpers.js";

    /**
     * @typedef {Object} PullRequest
     * @property {string} html_url
     * @property {string} title
     * @property {number} comments
     * @property {number} review_comments
     * @property {number} changed_files
     * @property {number} additions
     * @property {number} deletions
     */

    /**
     * Pull request data
     * @type {PullRequest}
     */
    let { pr } = $props();

    // Safe derived values with defaults
    let totalComments = $derived(
        (pr?.comments ?? 0) + (pr?.review_comments ?? 0),
    );
    let changedFiles = $derived(pr?.changed_files ?? 0);
    let additions = $derived(pr?.additions ?? 0);
    let deletions = $derived(pr?.deletions ?? 0);
</script>

<div class="pr-info">
    <div class="pr-header">
        <div class="flex">
            <a
                title="Github"
                href={pr?.html_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open pull request on GitHub"
            >
                <i class="bx bx-git-pull-request"></i></a
            >
            <h3>{pr?.title ?? "Untitled"}</h3>
        </div>
        <span class="count">{totalComments}</span>
    </div>
    <div class="changes">
        <p>
            {pluralize(changedFiles, "file")} changed
        </p>
        <div class="lines">
            <p>
                <span class="add"> +{additions}</span>
                <span class="rem"> -{deletions}</span>
            </p>
            <p class="blocks">
                {#if additions >= deletions}
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
