/**
 * Cloudflare Workers Deploy Script (Node.js)
 * Usage: node deploy.js [staging|production]
 */

const { execSync } = require('child_process');
const path = require('path');

const env = process.argv[2] || 'production';
const workerDir = __dirname;

console.log(`🚀 Deploying Cloudflare Worker to ${env}...\n`);

try {
    // Check if wrangler is installed
    try {
        execSync('wrangler --version', { stdio: 'ignore' });
    } catch {
        console.log('⚠️  Wrangler CLI not found. Installing globally...');
        execSync('npm install -g wrangler', { stdio: 'inherit' });
    }

    // Check if logged in
    try {
        execSync('wrangler whoami', { stdio: 'ignore' });
    } catch {
        console.log('❌ Not logged in to Cloudflare. Please run: wrangler login');
        process.exit(1);
    }

    // Change to worker directory
    process.chdir(workerDir);

    // Deploy based on environment
    let deployCommand;
    if (env === 'staging') {
        console.log('📦 Deploying to staging...\n');
        deployCommand = 'wrangler deploy --env staging';
    } else if (env === 'production') {
        console.log('📦 Deploying to production...\n');
        deployCommand = 'wrangler deploy --env production';
    } else {
        console.log('📦 Deploying to default (production)...\n');
        deployCommand = 'wrangler deploy';
    }

    execSync(deployCommand, { stdio: 'inherit' });

    console.log('\n✅ Deployment complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Copy the Worker URL from above');
    console.log('   2. Set NEXT_PUBLIC_WORKER_URL in your .env or Vercel');
    console.log('   3. Run: node test-worker.js');

} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
}
