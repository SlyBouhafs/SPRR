// ============================================================================
// Authentication State
// ============================================================================

const STORAGE_KEY = "githubToken";
const GITHUB_TOKEN_PATTERN = /^gh[ps]_[a-zA-Z0-9]{36,}$/;

/**
 * Safely retrieves the GitHub token from localStorage
 * @returns {string} - The stored token or empty string if unavailable
 */
function getStoredToken() {
    try {
        return localStorage.getItem(STORAGE_KEY) || "";
    } catch (error) {
        console.error("Failed to access localStorage:", error);
        return "";
    }
}

/**
 * Safely stores the GitHub token in localStorage
 * @param {string} token - The token to store
 * @returns {boolean} - True if successfully stored, false otherwise
 */
function setStoredToken(token) {
    try {
        localStorage.setItem(STORAGE_KEY, token);
        return true;
    } catch (error) {
        console.error("Failed to save token to localStorage:", error);
        return false;
    }
}

/**
 * Safely removes the GitHub token from localStorage
 * @returns {boolean} - True if successfully removed, false otherwise
 */
function removeStoredToken() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error("Failed to remove token from localStorage:", error);
        return false;
    }
}

/**
 * Validates if a token matches GitHub token format
 * @param {string} token - Token to validate
 * @returns {boolean} - True if token format is valid
 */
function isValidTokenFormat(token) {
    if (!token || typeof token !== "string") {
        return false;
    }
    return GITHUB_TOKEN_PATTERN.test(token);
}

/**
 * Trims and validates a token string
 * @param {string} token - Token to sanitize
 * @returns {string} - Sanitized token
 */
function sanitizeToken(token) {
    return token ? token.trim() : "";
}

let _token = $state(getStoredToken());
let _isAuthenticated = $derived(!!_token);

/**
 * Creates and exports the authentication state manager
 * Handles GitHub token storage and authentication status with validation
 */
export function createAuthState() {
    return {
        /**
         * Gets the current authentication token
         * @returns {string} - Current token
         */
        get token() {
            return _token;
        },

        /**
         * Gets the authentication status
         * @returns {boolean} - True if authenticated
         */
        get isAuthenticated() {
            return _isAuthenticated;
        },

        /**
         * Checks if current token format is valid
         * @returns {boolean} - True if token format is valid
         */
        get isValidFormat() {
            return isValidTokenFormat(_token);
        },

        /**
         * Logs in with a new token
         * @param {string} newToken - GitHub personal access token
         * @returns {boolean} - True if login successful
         */
        login(newToken) {
            const sanitized = sanitizeToken(newToken);

            if (!sanitized) {
                console.error("Cannot login with empty token");
                return false;
            }

            if (!isValidTokenFormat(sanitized)) {
                console.warn(
                    "Token format doesn't match GitHub PAT pattern. It may not work correctly.",
                );
            }

            _token = sanitized;
            const stored = setStoredToken(sanitized);

            if (!stored) {
                console.error(
                    "Token set in memory but failed to persist to storage",
                );
            }

            return true;
        },

        /**
         * Logs out and clears authentication
         * @returns {boolean} - True if logout successful
         */
        logout() {
            _token = "";
            return removeStoredToken();
        },

        /**
         * Clears token if it's invalid or expired
         * Useful for handling API auth errors
         * @returns {void}
         */
        clearInvalidToken() {
            if (_token) {
                console.warn("Clearing potentially invalid token");
                this.logout();
            }
        },
    };
}

/**
 * Singleton instance of authentication state
 */
export const auth = createAuthState();

// ============================================================================
// Panel Comments State
// ============================================================================

// Store for individual panel comment counts using $state
let _panelComments = $state({
    1: 0,
    2: 0,
    3: 0,
});

// Derived total comments count using $derived
let _totalCommentsCount = $derived(
    Object.values(_panelComments).reduce((sum, count) => sum + count, 0),
);

/**
 * Creates and exports the panel comments state manager
 * Provides access to panel comment counts and update methods
 */
export function createPanelCommentsState() {
    return {
        get counts() {
            return _panelComments;
        },
        getCount(panelIndex) {
            return _panelComments[panelIndex];
        },
        updatePanel(panelIndex, count) {
            _panelComments[panelIndex] = count;
        },
        resetPanel(panelIndex) {
            _panelComments[panelIndex] = 0;
        },
    };
}

/**
 * Singleton instance of panel comments state
 */
export const panelComments = createPanelCommentsState();

/**
 * Reactive total comments count across all panels
 * This is a derived value that automatically updates when any panel count changes
 */
export const totalCommentsCount = {
    get value() {
        return _totalCommentsCount;
    },
};

// ============================================================================
// URL Propagation State
// ============================================================================

// Store for URL propagation between panels using $state
let _urlPropagation = $state({
    url: "",
    sourceIndex: null,
    autoLoad: false,
});

/**
 * Creates and exports the URL propagation state manager
 * Handles URL sharing between panels for auto-fill functionality
 */
export function createUrlPropagationState() {
    return {
        get url() {
            return _urlPropagation.url;
        },
        get sourceIndex() {
            return _urlPropagation.sourceIndex;
        },
        get autoLoad() {
            return _urlPropagation.autoLoad;
        },
        get value() {
            return _urlPropagation;
        },
        set(data) {
            _urlPropagation = data;
        },
    };
}

/**
 * Singleton instance of URL propagation state
 */
export const urlPropagation = createUrlPropagationState();
