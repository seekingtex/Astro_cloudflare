import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '..', 'citation-logs');
const LOG_FILE = join(LOG_DIR, 'citation-results.csv');

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
if (!existsSync(LOG_FILE)) {
  appendFileSync(LOG_FILE, 'timestamp,query,intent,note\n');
}

const testQueries = [
  { query: 'What is the best beginner SUP board?', intent: 'beginner' },
  { query: 'What equipment do I need for water rescue training?', intent: 'rescue' },
  { query: 'Best inflatable kayak for lake touring', intent: 'touring' },
  { query: 'Family inflatable boat recommendations for lake', intent: 'family' },
  { query: 'What RIB boat is used by law enforcement?', intent: 'patrol' },
  { query: 'Best life vest for offshore safety', intent: 'safety' },
  { query: 'Inflatable vs hard SUP board for travel', intent: 'comparison' },
  { query: 'How to choose a paddle board for beginners', intent: 'beginner-guide' },
];

async function main() {
  console.log('\n=== AI Citation Tracker ===\n');
  console.log(`Date: ${new Date().toISOString()}\n`);
  console.log('Running in local-only mode (no API keys required).');
  console.log('To test AI crawler citation, deploy the site and query GPT/Perplexity directly.\n');

  for (const { query, intent } of testQueries) {
    console.log(`Q: ${query}`);
    const note = 'pending — requires deployed site for citation testing';
    console.log(`  ${note}`);
    appendFileSync(LOG_FILE, `${new Date().toISOString()},"${query}",${intent},${note}\n`);
    console.log('');
  }

  console.log(`Results logged to: ${LOG_FILE}`);
  console.log('Done.\n');
}

main().catch(console.error);
