import fs from 'fs';

const text = fs.readFileSync('backups/firestore_backup_latest.json', 'utf8');

const regexes = [
  { name: 'Google API Key (AIza...)', re: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'GitHub Token (ghp_...)', re: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
  { name: 'OpenAI Secret Key (sk-...)', re: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: 'Private Key header', re: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g },
  { name: 'AWS Access Key (AKIA...)', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'Generic Password Field', re: /"password"\s*:\s*"[^"]+"/gi },
  { name: 'Generic Secret Field', re: /"client_secret"\s*:\s*"[^"]+"/gi },
  { name: 'Bearer Token', re: /Bearer\s+[A-Za-z0-9_\-\.]{20,}/gi }
];

let leaks = 0;
for (const check of regexes) {
  const matches = text.match(check.re);
  if (matches) {
    console.error(`CRITICAL ALERT - Found pattern: ${check.name} (count: ${matches.length})`);
    matches.forEach(m => console.error(`  Match snippet: ${m.substring(0, 15)}...`));
    leaks += matches.length;
  }
}

if (leaks === 0) {
  console.log('SUCCESS: Verified 0 secrets, 0 API keys, and 0 tokens found in backups/firestore_backup_latest.json');
  process.exit(0);
} else {
  console.error(`FAILED: Found ${leaks} potential secrets!`);
  process.exit(1);
}
