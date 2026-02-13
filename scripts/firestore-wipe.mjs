#!/usr/bin/env node
/**
 * Firestore Wipe Script (DANGEROUS)
 * Deletes ALL documents from ALL collections in the selected Firestore database.
 *
 * Requirements:
 * - A service account key (or ADC) with Firestore admin permissions
 * - GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
 *
 * Usage:
 *   node scripts/firestore-wipe.mjs --projectId <project-id>
 *   node scripts/firestore-wipe.mjs --projectId <project-id> --yes
 *   node scripts/firestore-wipe.mjs --projectId <project-id> --deleteAuthUsers
 *
 * Safety:
 * - Without --yes, you must type: DELETE <project-id>
 * - If --deleteAuthUsers is set, you must type: DELETE AUTH <project-id>
 */

import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function parseArgs(argv) {
  const args = { projectId: '', yes: false, batchSize: 250, deleteAuthUsers: false };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--projectId' && value) {
      args.projectId = value;
      i += 1;
      continue;
    }
    if (key === '--yes') {
      args.yes = true;
      continue;
    }
    if (key === '--deleteAuthUsers') {
      args.deleteAuthUsers = true;
      continue;
    }
    if (key === '--batchSize' && value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 500) {
        throw new Error('--batchSize must be a number between 1 and 500');
      }
      args.batchSize = parsed;
      i += 1;
      continue;
    }
  }
  return args;
}

async function confirmOrExit(projectId, yes, deleteAuthUsers) {
  if (yes) {
    return;
  }
  const rl = readline.createInterface({ input, output });
  try {
    const expected = deleteAuthUsers
      ? `DELETE AUTH ${projectId}`
      : `DELETE ${projectId}`;
    const answer = await rl.question(
      `This will DELETE ALL Firestore data in project "${projectId}".\nType "${expected}" to continue: `,
    );
    if (answer.trim() !== expected) {
      console.error('Aborted.');
      process.exit(1);
    }
  } finally {
    rl.close();
  }
}

async function deleteCollectionRecursive(collectionRef, batchSize) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) {
      return;
    }

    const batch = collectionRef.firestore.batch();

    for (const doc of snapshot.docs) {
      const subcollections = await doc.ref.listCollections();
      for (const sub of subcollections) {
        await deleteCollectionRecursive(sub, batchSize);
      }
      batch.delete(doc.ref);
    }

    await batch.commit();
  }
}

async function main() {
  const { projectId, yes, batchSize, deleteAuthUsers } = parseArgs(process.argv);
  if (!projectId) {
    console.error('Missing --projectId <project-id>');
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      'Missing GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON.',
    );
    console.error(
      'Example: export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccount.json"',
    );
    process.exit(1);
  }

  await confirmOrExit(projectId, yes, deleteAuthUsers);

  const app = initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  const db = getFirestore(app);
  const auth = getAuth(app);

  console.log(`Listing collections in project "${projectId}"...`);
  const collections = await db.listCollections();
  if (collections.length === 0) {
    console.log('No collections found. Nothing to delete.');
  } else {
    for (const col of collections) {
      console.log(`Deleting collection "${col.id}"...`);
      await deleteCollectionRecursive(col, batchSize);
    }
  }

  if (deleteAuthUsers) {
    console.log(`Deleting ALL Firebase Auth users in project "${projectId}"...`);
    const uids = [];
    let pageToken = undefined;
    do {
      const result = await auth.listUsers(1000, pageToken);
      for (const user of result.users) {
        uids.push(user.uid);
      }
      pageToken = result.pageToken;
    } while (pageToken);

    if (uids.length === 0) {
      console.log('No Firebase Auth users found.');
    } else {
      console.log(`Found ${uids.length} Firebase Auth users. Deleting...`);
      const chunkSize = 1000;
      for (let i = 0; i < uids.length; i += chunkSize) {
        const chunk = uids.slice(i, i + chunkSize);
        const res = await auth.deleteUsers(chunk);
        if (res.failureCount > 0) {
          console.warn(
            `Deleted ${res.successCount}/${chunk.length} in this batch. Failures: ${res.failureCount}`,
          );
          for (const err of res.errors) {
            console.warn(`- uid=${chunk[err.index]} error=${err.error?.message || err.error}`);
          }
        } else {
          console.log(`Deleted ${chunk.length} users...`);
        }
      }
    }
  }

  console.log(
    deleteAuthUsers
      ? 'Done. All Firestore docs and Firebase Auth users deleted.'
      : 'Done. All Firestore documents deleted.',
  );
}

main().catch((error) => {
  console.error('Wipe failed:', error);
  process.exit(1);
});
