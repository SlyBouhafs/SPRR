<script>
    import { auth } from "./state/auth.svelte.js";
    import Header from "./components/Header.svelte";
    import Login from "./components/Login.svelte";
    import PRComparator from "./components/PRComparator.svelte";
</script>

<Header />

{#if auth.isAuthenticated}
    <PRComparator />
{:else}
    <Login />
{/if}
