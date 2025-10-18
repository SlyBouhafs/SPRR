<script>
    import { fade } from "svelte/transition";
    import { getToastIconClass } from "../utils/helpers.js";

    let { message, type } = $props();
</script>

{#if message}
    <div transition:fade class="notification notification-{type} show">
        <span>
            <i class={getToastIconClass(type)}></i>
        </span>
        <span>
            {message}
        </span>
    </div>
{/if}
