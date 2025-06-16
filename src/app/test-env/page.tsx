export default function TestEnvPage() {
  return (
    <div className="ui container" style={{ marginTop: '2rem' }}>
      <h1>Environment Variables Test</h1>
      <div className="ui segment">
        <h2>GitHub Configuration</h2>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          whiteSpace: 'pre-wrap'
        }}>
          {JSON.stringify({
            GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'present' : 'missing',
            GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER || 'missing',
            GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME || 'missing',
            NODE_ENV: process.env.NODE_ENV,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 