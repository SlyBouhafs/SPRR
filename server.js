import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { Octokit } from '@octokit/rest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
}

async function fetchAll(method, params) {
    const results = [];
    let page = 1;

    while (true) {
        const { data } = await method({ ...params, per_page: 100, page });
        results.push(...data);
        if (data.length < 100) break;
        page++;
    }

    return results;
}

app.post('/api/pr/:owner/:repo/:number', async (req, res) => {
    try {
        const { owner, repo, number } = req.params;
        const octokit = new Octokit({ auth: req.body.token });

        const [pr, comments, reviewComments, reviews, files] = await Promise.all([
            octokit.pulls.get({ owner, repo, pull_number: number }).then(r => r.data),
            fetchAll(octokit.issues.listComments.bind(octokit.issues), { owner, repo, issue_number: number }),
            fetchAll(octokit.pulls.listReviewComments.bind(octokit.pulls), { owner, repo, pull_number: number }),
            fetchAll(octokit.pulls.listReviews.bind(octokit.pulls), { owner, repo, pull_number: number }),
            fetchAll(octokit.pulls.listFiles.bind(octokit.pulls), { owner, repo, pull_number: number })
        ]);

        res.json({ pr, comments, reviewComments, reviews, files });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

app.patch('/api/comment/:type/:owner/:repo/:id', async (req, res) => {
    try {
        const { type, owner, repo, id } = req.params;
        const octokit = new Octokit({ auth: req.body.token });

        const method = type === 'issue'
            ? octokit.issues.updateComment
            : octokit.pulls.updateReviewComment;

        const { data } = await method({ owner, repo, comment_id: id, body: req.body.body });
        res.json(data);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));
}

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));