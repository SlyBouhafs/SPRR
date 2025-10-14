# SPRR PR REVIEW

SPRR is a lightweight svelte web app that makes it easy to review and compare multiple pull requests side-by-side.

## 🚀 Getting Started

1. Clone the repository `git clone https://github.com/SlyBouhafs/SPRR`
2. Install dependencies `npm install`
3. Run the app `npm run dev:all`
4. Open the displayed url and start comparing PRs!

## ✨ Features

-   Compare up to 3 PRs side-by-side
-   No CORS issues – GitHub API calls are handled through a backend proxy
-   Works seamlessly with private repositories
-   Responsive UI with dark mode by default
-   Displays all comment types (general, review, inline)
-   Quick copy and link buttons for every comment
-   Comments grouped by file and ordered by line number
-   Collapsible sections for files, comments, and lines
-   Displays comment counts per section and file
-   Edit comments directly within the interface
-   Markdown support for rich text formatting
-   Auto-refreshing comment feed
-   Inline diff view for every comment
-   Secure token storage via browser localStorage
