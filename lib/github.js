const GITHUB_API_URL = 'https://api.github.com';

function getRepoConfig() {
  const repository = process.env.GITHUB_REPOSITORY || `${process.env.GITHUB_OWNER || 'josephaj333'}/${process.env.GITHUB_REPO_NAME || 'Daily-primes'}`;
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required for admin content updates.');
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY environment variable must be in the format owner/repo.');
  }

  return { owner, repo, token };
}

async function githubFetch(path, init = {}) {
  const { token } = getRepoConfig();
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const body = await response.json();
  if (!response.ok) {
    const message = body.message || 'GitHub API request failed';
    throw new Error(`${message} (${response.status})`);
  }

  return body;
}

export async function getGitHubFile(path) {
  const { owner, repo } = getRepoConfig();
  try {
    return await githubFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`);
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function listGitHubPostFiles() {
  const { owner, repo } = getRepoConfig();
  const data = await githubFetch(`/repos/${owner}/${repo}/contents/data/posts`);
  if (!Array.isArray(data)) {
    return [];
  }

  const files = data.filter((item) => item.type === 'file' && item.name.endsWith('.json'));
  return Promise.all(
    files.map(async (file) => {
      const fileData = await getGitHubFile(`data/posts/${file.name}`);
      const parsed = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
      return {
        ...parsed,
        sha: fileData.sha,
      };
    })
  );
}

export async function createOrUpdateGitHubFile(path, content, message, sha) {
  const { owner, repo } = getRepoConfig();
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    ...(sha ? { sha } : {}),
  };

  return githubFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function createOrUpdateGitHubBinaryFile(path, base64Content, message, sha) {
  const { owner, repo } = getRepoConfig();
  const body = {
    message,
    content: base64Content,
    ...(sha ? { sha } : {}),
  };

  return githubFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteGitHubFile(path, sha, message) {
  const { owner, repo } = getRepoConfig();
  if (!sha) {
    throw new Error('SHA is required to delete a GitHub file.');
  }

  const body = {
    message,
    sha,
  };

  return githubFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
}
