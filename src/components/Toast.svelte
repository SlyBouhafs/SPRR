<script>
    import { fade } from "svelte/transition";
    let { message, type } = $props();
</script>

{#if message}
    <div transition:fade class="notification notification-{type} show">
        <span>
            <i
                class={[
                    type === "success" && "bx bxs-check-square",
                    type === "error" && "bx bxs-x-square",
                    type === "info" && "bx bxs-info-square",
                ]}
            >
            </i>
        </span>
        <span>
            {message}
        </span>
    </div>
{/if}
