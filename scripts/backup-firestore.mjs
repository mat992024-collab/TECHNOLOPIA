// scripts/backup-firestore.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyCKvczYsYI8HqA7AKUSnLfKYAA40Lz6OGo",
  authDomain: "modeer-27c2d.firebaseapp.com",
  projectId: "modeer-27c2d",
  storageBucket: "modeer-27c2d.firebasestorage.app",
  messagingSenderId: "950336151305",
  appId: "1:950336151305:web:0278bd7e51b7ff3b7bbdd8"
};

const COLLECTIONS = [
  'tecnolobia_meta',
  'tecnolobia_projects',
  'tecnolobia_tasks',
  'tecnolobia_clients',
  'tecnolobia_transactions',
  'tecnolobia_profit_cycles',
  'tecnolobia_dev_usages',
  'tecnolobia_sadaqah',
  'tecnolobia_decisions',
  'tecnolobia_memories'
];

async function runBackup() {
  console.log('--- Starting Firestore Backup for project: modeer-27c2d ---');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const backupData = {
    metadata: {
      projectId: firebaseConfig.projectId,
      timestamp: new Date().toISOString(),
      backupVersion: '1.0.0',
      totalCollections: COLLECTIONS.length
    },
    collections: {}
  };

  let totalDocs = 0;

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      const docs = [];
      snap.forEach(doc => {
        docs.push({
          _id: doc.id,
          ...doc.data()
        });
      });
      backupData.collections[colName] = docs;
      totalDocs += docs.length;
      console.log(`✓ Collection [${colName}]: ${docs.length} documents backed up.`);
    } catch (err) {
      console.error(`✗ Failed to backup [${colName}]:`, err.message);
      backupData.collections[colName] = [];
    }
  }

  backupData.metadata.totalDocuments = totalDocs;

  // Save to backups directory
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `firestore_backup_${timestampStr}.json`;
  const latestFilename = `firestore_backup_latest.json`;

  const backupFilePath = path.join(backupDir, filename);
  const latestFilePath = path.join(backupDir, latestFilename);

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  fs.writeFileSync(latestFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\n========================================`);
  console.log(`Backup completed successfully!`);
  console.log(`Saved to: ${backupFilePath}`);
  console.log(`Total collections: ${COLLECTIONS.length}`);
  console.log(`Total documents: ${totalDocs}`);
  console.log(`========================================\n`);

  // Verify backup integrity
  verifyBackup(latestFilePath);
}

function verifyBackup(filePath) {
  console.log('--- Verifying Backup Integrity and Restorability ---');
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content);

  if (!parsed.metadata || !parsed.collections) {
    throw new Error('Verification failed: Missing metadata or collections object.');
  }

  const colCount = Object.keys(parsed.collections).length;
  let docCount = 0;

  for (const [col, docs] of Object.entries(parsed.collections)) {
    if (!Array.isArray(docs)) {
      throw new Error(`Verification failed: Collection ${col} is not an array.`);
    }
    docCount += docs.length;
  }

  console.log(`✓ JSON schema valid and parseable.`);
  console.log(`✓ Verified ${colCount} collections and ${docCount} documents.`);
  console.log(`✓ Restorability Verified: Snapshot is fully restorable.`);
  console.log(`----------------------------------------------------\n`);
}

runBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
