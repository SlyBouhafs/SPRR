<script>
    import { auth } from "../state/state.svelte.js";
    import { fade } from "svelte/transition";

    /**
     * GitHub Personal Access Token entered by user
     * @type {string}
     */
    let token = $state("");

    /**
     * Handles form submission and logs user in with provided token
     * @param {SubmitEvent} e - Form submit event
     * @returns {void}
     */
    function handleSubmit(e) {
        e.preventDefault();
        if (token.trim()) {
            auth.login(token.trim());
        }
    }
</script>

<div transition:fade class="login-screen">
    <div class="login-box">
        <h2 id="login-title">GitHub PR Comparator</h2>
        <p id="login-description">Enter your GitHub Personal Access Token</p>

        <form
            onsubmit={handleSubmit}
            aria-labelledby="login-title"
            aria-describedby="login-description"
        >
            <label for="token">Personal Access Token</label>
            <input
                id="token"
                type="password"
                bind:value={token}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                aria-describedby="token-help"
                aria-required="true"
                autocomplete="off"
            />

            <button
                type="submit"
                class="login-btn"
                disabled={!token.trim()}
                aria-label="Connect to GitHub with provided token"
            >
                Connect to GitHub
            </button>
        </form>

        <div
            class="info-box"
            id="token-help"
            role="region"
            aria-label="Token creation instructions"
        >
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
