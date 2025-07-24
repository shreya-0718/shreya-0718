import fs from 'fs';
import { Octokit } from 'octokit';
import dayjs from 'dayjs';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function updateReadme() {
  const { data: starred } = await octokit.rest.activity.listReposStarredByUser({
    username: 'shreyaluu',
    per_page: 1
  });
  const latestStar = starred[0]?.full_name || 'None';

  const { data: events } = await octokit.rest.activity.listPublicEventsForUser({
    username: 'shreyaluu',
    per_page: 100
  });

  const pushEvent = events.find(event => event.type === 'PushEvent');
  let lastCommitLine = 'No recent commits found.';
  if (pushEvent) {
    const repoName = pushEvent.repo.name;
    const commit = pushEvent.payload.commits?.[0];
    if (commit) {
      lastCommitLine = `${repoName}`;
    }
  }

  const sevenDaysAgo = dayjs().subtract(7, 'day');
  let commitCount = 0;
  for (const event of events) {
    if (event.type === 'PushEvent') {
      const pushedAt = dayjs(event.created_at);
      if (pushedAt.isAfter(sevenDaysAgo)) {
        commitCount += event.payload.commits?.length || 0;
      }
    }
  }

  const readme = fs.readFileSync('README.md', 'utf8');
  const updated = readme
    .replace(/{{STARRED_REPO}}/, latestStar)
    .replace(`/{{LAST_COMMIT}}/`, lastCommitLine)
    .replace(`/{{COMMIT_COUNT}}/`, `${commitCount}`);

  fs.writeFileSync('README.md', updated);
}

updateReadme();