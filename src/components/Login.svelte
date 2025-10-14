<script>
    import { auth } from "../state/auth.svelte.js";
    import { fade } from "svelte/transition";

    let token = $state("");

    function handleSubmit(e) {
        e.preventDefault();
        if (token.trim()) {
            auth.login(token.trim());
        }
    }
</script>

<div transition:fade class="login-screen">
    <div class="login-box">
        <h2>GitHub PR Comparator</h2>
        <p>Enter your GitHub Personal Access Token</p>

        <form onsubmit={handleSubmit}>
            <label for="token">Personal Access Token</label>
            <input
                id="token"
                type="password"
                bind:value={token}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />

            <button type="submit" class="login-btn" disabled={!token.trim()}>
                Connect to GitHub
            </button>
        </form>

        <div class="info-box">
            <p>How to create a token:</p>
            <ol>
                <li>Go to GitHub Settings → Developer settings</li>
                <li>Click "Personal access tokens" → "Tokens (classic)"</li>
                <li>Generate token with "repo" scope</li>
                <li>Paste it above</li>
            </ol>
        </div>
    </div>
</div>
