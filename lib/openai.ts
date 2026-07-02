import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface CommitData {
  sha: string
  message: string
  author: string
  date: string
}

export async function generateChangelog(
  commits: CommitData[],
  repoName: string,
  version: string
): Promise<{ title: string; body: string }> {
  const commitList = commits
    .map((c) => `- ${c.message} (by ${c.author})`)
    .join('\n')

  const prompt = `You are a technical writer creating a user-facing changelog entry for a software product.

Repo: ${repoName}
Version: ${version}

Raw commits:
${commitList}

Write a concise, friendly changelog entry. Use this exact JSON format:
{
  "title": "Short headline for this release (max 60 chars)",
  "body": "Markdown body with ## sections like: ### New Features, ### Bug Fixes, ### Improvements. Keep it clear and non-technical for end users. Max 200 words."
}

Return ONLY valid JSON, no extra text.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 600,
    response_format: { type: 'json_object' }
  })

  const raw = response.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw)
  return { title: parsed.title ?? version, body: parsed.body ?? '' }
}
