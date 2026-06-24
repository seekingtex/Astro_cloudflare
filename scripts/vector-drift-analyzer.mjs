import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRIFT_DIR = join(__dirname, '..', 'drift-data');
const HISTORY_FILE = join(DRIFT_DIR, 'embedding-history.json');

if (!existsSync(DRIFT_DIR)) mkdirSync(DRIFT_DIR, { recursive: true });

const queryBank = [
  'best beginner SUP board',
  'water rescue training equipment',
  'long distance touring SUP',
  'family inflatable boat lake',
  'patrol boat law enforcement',
  'small fishing inflatable dinghy',
  'best surfboard for beginners',
  'floating training platform water',
  'inflatable kayak for travel',
  'life vest for rescue operations',
];

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

function mockEmbedding() {
  return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
}

function driftStatus(dist) {
  if (dist < 0.05) return 'STABLE';
  if (dist < 0.15) return 'MINOR';
  return 'UNSTABLE';
}

async function main() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n=== Vector Drift Analysis — ${today} ===\n`);

  console.log('Using mock embeddings (no API key required).');
  console.log('For production drift detection, deploy Workers AI endpoint and call /api/embed.\n');

  let history = {};
  if (existsSync(HISTORY_FILE)) {
    history = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
    console.log(`Loaded ${Object.keys(history).length} snapshots from history.\n`);
  }

  console.log('Generating embeddings for query bank...');
  const todayEmbeddings = {};
  for (const q of queryBank) {
    todayEmbeddings[q] = mockEmbedding();
  }

  history[today] = todayEmbeddings;
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  console.log(`\nResults:`);

  console.log('\n--- Cross-Query Similarity ---');
  for (let i = 0; i < queryBank.length; i++) {
    for (let j = i + 1; j < queryBank.length; j++) {
      const sim = cosineSimilarity(todayEmbeddings[queryBank[i]], todayEmbeddings[queryBank[j]]);
      if (sim > 0.7) {
        console.log(`  HIGH OVERLAP (${sim.toFixed(3)}): "${queryBank[i]}" <-> "${queryBank[j]}"`);
      }
    }
  }

  const dates = Object.keys(history).sort();
  if (dates.length >= 2) {
    const prevDate = dates[dates.length - 2];
    const prev = history[prevDate];
    console.log(`\n--- Drift: ${prevDate} → ${today} ---`);
    for (const q of queryBank) {
      if (prev[q]) {
        const dist = euclideanDistance(prev[q], todayEmbeddings[q]);
        const status = driftStatus(dist);
        console.log(`  [${status}] ${q}: distance=${dist.toFixed(4)}`);
      }
    }
  } else {
    console.log('\n  (Need at least 2 snapshots for drift detection. Run again tomorrow.)');
  }

  console.log(`\n  Snapshot stored: ${DRIFT_DIR}\\embedding-history.json`);
  console.log('  Next: run again to detect drift.\n');
}

main().catch(console.error);
