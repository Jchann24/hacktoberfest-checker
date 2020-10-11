/*
{
    "path": "Path parameter",
    "httpMethod": "Incoming request's method name"
    "headers": {Incoming request headers}
    "queryStringParameters": {query string parameters }
    "body": "A JSON string of the request payload."
    "isBase64Encoded": "A boolean flag to indicate if the applicable request payload is Base64-encode"
}
*/

const { Octokit } = require('@octokit/rest')

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
})

const keyTopic = 'hacktoberfest'
const keyPrLabel = 'hacktoberfest-accepted'

const getRepo = async () => {
  return await octokit.repos.get({
    owner: 'lukeocodes',
    repo: 'hacktoberfest-checker',
  })
}

const getTopics = async (repo) => {
  const {
    data: { names: topics },
  } = await octokit.repos.getAllTopics({
    owner: repo.owner.login,
    repo: repo.name,
  })

  return topics
}

const getPulls = async (repo) => {
  const { data: pulls } = await octokit.pulls.list({
    owner: repo.owner.login,
    repo: repo.name,
    state: 'all',
  })

  return pulls
}

const hasTopic = (topics) => {
  return topics.includes(keyTopic)
}

const hasTaggedPrs = (pulls) => {
  return (
    pulls.filter((p) => {
      return p.labels.filter((l) => l.name === keyPrLabel).length > 0
    }).length > 0
  )
}

exports.handler = async (event, context, callback) => {
  const { data: repo } = await getRepo(
    'https://github.com/lukeocodes/hacktoberfest-checker'
  )
  const topics = await getTopics(repo)
  const pulls = await getPulls(repo)

  const body = {
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    requested_at: new Date(),
    topics,
    topic: hasTopic(topics),
    tag_prs: hasTaggedPrs(pulls),
    recent_prs: false, // todo: return true if it has any PRs approved/merged in the last X days - probably won't do this
    repo_updated_at: repo.updated_at,
    language: repo.language,
    license: repo.license,
    forks: repo.forks,
    stargazers_count: repo.stargazers_count,
  }

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(body),
  })
}
