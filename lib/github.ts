import { Octokit } from '@octokit/rest'

export function getOctokit(token?: string) {
  return new Octokit({ auth: token ?? process.env.GITHUB_PAT })
}

export async function registerWebhook(
  owner: string,
  repo: string,
  webhookUrl: string
) {
  const octokit = getOctokit()
  try {
    await octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret: process.env.NEXTAUTH_SECRET!
      },
      events: ['push', 'release', 'create'],
      active: true
    })
  } catch (err: unknown) {
    // 422 = webhook already exists, safe to ignore
    if ((err as { status?: number }).status !== 422) throw err
  }
}

export async function getCommitsBetweenTags(
  owner: string,
  repo: string,
  base: string,
  head: string
) {
  const octokit = getOctokit()
  const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`
  })
  return data.commits.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split('\n')[0],
    author: c.commit.author?.name ?? 'unknown',
    date: c.commit.author?.date ?? new Date().toISOString()
  }))
}

export async function getRecentCommits(
  owner: string,
  repo: string,
  since?: string,
  perPage = 30
) {
  const octokit = getOctokit()
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since,
    per_page: perPage
  })
  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split('\n')[0],
    author: c.commit.author?.name ?? 'unknown',
    date: c.commit.author?.date ?? new Date().toISOString()
  }))
}

export async function listUserRepos(accessToken: string) {
  const octokit = getOctokit(accessToken)
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 50,
    type: 'owner'
  })
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    description: r.description,
    url: r.html_url,
    updatedAt: r.updated_at
  }))
}
