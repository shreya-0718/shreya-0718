import { readFile, readFileSync, writeFileSync } from 'fs';
import { Octokit } from 'octokit';
import dayjs from 'dayjs';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function updateReadme() {
  const { data: starred } = await octokit.rest.activity.listReposStarredByUser({
    username: 'shreya-0718',
    per_page: 1
  });
  const latestStar = starred[0]?.full_name || 'None';

  const { data: events } = await octokit.rest.activity.listPublicEventsForUser({
    username: 'shreya-0718',
    per_page: 100
  });

  const pushEvents = events.filter(event =>
    event.type === 'PushEvent' && event.repo.name !== 'shreya0718/shreya0718'
  );

  let lastCommitLine = 'No recent commits found.';
  
  if (pushEvents.length > 0) {
    const mostRecentPush = pushEvents[0];
    const repoName = mostRecentPush.repo.name;
    const commit = mostRecentPush.payload.commits?.[0];
  
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

  const template = readFileSync("template.md", "utf8");

  console.log(latestStar);
  console.log(lastCommitLine);
  console.log(commitCount);

  const updated = template
    .replace(`{{STARRED_REPO}}`, latestStar)
    .replace(`{{LAST_COMMIT}}`, lastCommitLine)
    .replace(`{{COMMIT_COUNT}}`, commitCount.toString());

  if (updated !== template) {
    console.log("README changed — writing file!");
  } else {
    console.log("No change detected — skipping write.");
  }

  writeFileSync('README.md', updated);

  console.log("README written!");
}

updateReadme();
