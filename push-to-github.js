import { Octokit } from '@octokit/rest';

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createRepository(repoName, description, isPrivate = false) {
  const octokit = await getGitHubClient();
  
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: description,
      private: isPrivate,
      auto_init: false
    });
    
    console.log(`✅ Repository created: ${data.html_url}`);
    console.log(`📦 Clone URL: ${data.clone_url}`);
    console.log(`🔗 SSH URL: ${data.ssh_url}`);
    
    return data;
  } catch (error) {
    if (error.status === 422) {
      console.log('❌ Repository already exists with this name');
      const { data: user } = await octokit.users.getAuthenticated();
      const existingUrl = `https://github.com/${user.login}/${repoName}`;
      console.log(`📦 Existing repository: ${existingUrl}`);
      return { html_url: existingUrl, clone_url: `https://github.com/${user.login}/${repoName}.git` };
    }
    throw error;
  }
}

async function main() {
  const repoName = process.argv[2] || 'compartment-users-app';
  const description = process.argv[3] || 'Angular 18 application with dependent dropdown fields';
  const isPrivate = process.argv[4] === 'true';
  
  console.log(`Creating GitHub repository: ${repoName}`);
  console.log(`Description: ${description}`);
  console.log(`Privacy: ${isPrivate ? 'Private' : 'Public'}`);
  
  const repo = await createRepository(repoName, description, isPrivate);
  
  console.log('\n📋 Next steps:');
  console.log('1. Run these commands in the Shell:');
  console.log(`   git remote add origin ${repo.clone_url}`);
  console.log('   git add .');
  console.log('   git commit -m "Initial commit: Angular compartment-users app with Express backend"');
  console.log('   git push -u origin main');
}

main().catch(console.error);
