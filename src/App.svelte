<script>
    import { auth } from "./state/state.svelte.js";
    import Header from "./components/Header.svelte";
    import Login from "./components/Login.svelte";
    import PRMain from "./components/PRMain.svelte";
</script>

<Header />

{#if auth.isAuthenticated}
    <PRMain />
{:else}
    <Login />
{/if}
