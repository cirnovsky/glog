import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getRepoId() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is not set');
    }
    if (!process.env.GITHUB_REPO_OWNER) {
      throw new Error('GITHUB_REPO_OWNER is not set');
    }
    if (!process.env.GITHUB_REPO_NAME) {
      throw new Error('GITHUB_REPO_NAME is not set');
    }

    const response = await octokit.rest.repos.get({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
    });

    console.log('Repository ID:', response.data.id);
    console.log('\nAdd this to your .env file:');
    console.log(`GITHUB_REPO_ID=${response.data.id}`);
  } catch (error) {
    console.error('Error getting repository ID:', error);
    process.exit(1);
  }
}

getRepoId(); 