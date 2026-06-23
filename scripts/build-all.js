/**
 * build-all.js
 *
 * Reads src/data/site/languages.yaml and builds each enabled locale.
 * Usage: node scripts/build-all.js
 *
 * For one-click deployment to Cloudflare, use the CI/CD pipeline (push to main).
 * This script is for local testing and preview.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const languagesPath = path.resolve(__dirname, '..', 'src', 'data', 'site', 'languages.yaml');

if (!fs.existsSync(languagesPath)) {
  console.error('ERROR: languages.yaml not found at', languagesPath);
  process.exit(1);
}

let data;
try {
  const yaml = require('js-yaml');
  const content = fs.readFileSync(languagesPath, 'utf8');
  data = yaml.load(content);
} catch (err) {
  console.error('ERROR: Failed to parse languages.yaml:', err.message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error('ERROR: languages.yaml must be an array');
  process.exit(1);
}

const enabled = data.filter((l) => l.enabled);
const locales = enabled.map((l) => l.locale);

if (locales.length === 0) {
  console.log('No languages enabled. Defaulting to en.');
  locales.push('en');
}

console.log(`Enabled locales: ${locales.join(', ')}`);
console.log('');

for (const locale of locales) {
  console.log(`â–?Building ${locale}...`);
  const start = Date.now();
  try {
    execSync('yarn run build', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, SITE_LOCALE: locale },
      stdio: 'inherit',
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`âœ?${locale} built in ${elapsed}s`);
  } catch (err) {
    console.error(`âœ?${locale} build failed`);
    process.exit(1);
  }
  console.log('');
}

console.log('All enabled languages built successfully.');
console.log('');
console.log('To deploy:');
console.log('  For each locale, run from dist/server/:');
console.log('    npx wrangler deploy --config wrangler.ci.json --name Wavefella-{locale}');
console.log('');
console.log('Or push to main and the CI/CD pipeline will handle deployment automatically.');
