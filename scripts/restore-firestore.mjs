// scripts/restore-firestore.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

export async function restoreFromBackup(backupPath, targetProjectId = null) {
  const resolvedPath = path.resolve(backupPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Backup file not found at: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  const backup = JSON.parse(raw);

  const config = { ...firebaseConfig };
  if (targetProjectId) {
    config.projectId = targetProjectId;
  }

  console.log(`--- Restoring Firestore from backup: ${resolvedPath} ---`);
  console.log(`Target project: ${config.projectId}`);

  const app = initializeApp(config, `restore-${Date.now()}`);
  const db = getFirestore(app);

  let restoredCount = 0;

  for (const [colName, docs] of Object.entries(backup.collections)) {
    console.log(`Restoring collection: ${colName} (${docs.length} docs)...`);
    for (const d of docs) {
      const docId = d._id;
      const docData = { ...d };
      delete docData._id;

      await setDoc(doc(db, colName, docId), docData);
      restoredCount++;
    }
  }

  console.log(`✓ Restore finished successfully! Total restored documents: ${restoredCount}`);
  return restoredCount;
}

// Dry run validation if executed directly with --dry-run
if (process.argv.includes('--dry-run')) {
  const latestPath = path.resolve('backups/firestore_backup_latest.json');
  console.log('--- Dry run restoration test ---');
  if (fs.existsSync(latestPath)) {
    const raw = fs.readFileSync(latestPath, 'utf-8');
    const data = JSON.parse(raw);
    const collections = Object.keys(data.collections);
    let count = 0;
    collections.forEach(c => count += data.collections[c].length);
    console.log(`✓ Validated backup integrity: ${collections.length} collections, ${count} documents ready for restore.`);
  } else {
    console.error('Backup file not found.');
    process.exit(1);
  }
}
