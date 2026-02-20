import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {
  AdminSession,
  AppSession,
  CoworkerSession,
  LedgerTransaction,
  RecipientPhoneMapping,
  Recipient as RecipientModel,
  TransactionDirection,
  RecipientTransactionType,
  SharedTransactionType,
  Transaction,
  TransactionType,
} from '../models/types';
import { ADMIN_WHITELIST } from '../config/adminWhitelist';
import { createUuid } from '../utils/uuid';
import { generateInviteCode } from './invites';

const db = firestore();

export async function createOwnerProfile(params: {
  uid: string;
  name: string;
  phone?: string;
}) {
  const { uid, name, phone } = params;
  const now = firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  const userRef = db.collection('users').doc(uid);
  const ownerRef = db.collection('owners').doc(uid);

  batch.set(userRef, {
    uid,
    role: 'OWNER',
    name,
    phone: phone || null,
    createdAt: now,
  });

  batch.set(ownerRef, {
    ownerId: uid,
    name,
    phone: phone || null,
    createdAt: now,
  });

  await batch.commit();
}

export async function createCoworker(params: {
  ownerId: string;
  name: string;
  phone?: string;
}) {
  const { ownerId, name, phone } = params;
  const now = firestore.FieldValue.serverTimestamp();
  const coworkerRef = db.collection('coworkers').doc();
  const coworkerId = coworkerRef.id;
  const inviteCode = generateInviteCode();
  const inviteRef = db.collection('invites').doc(inviteCode);

  const batch = db.batch();
  batch.set(coworkerRef, {
    ownerId,
    name,
    phone: phone || null,
    status: 'ACTIVE',
    coworkerUserId: null,
    createdAt: now,
  });

  batch.set(inviteRef, {
    code: inviteCode,
    ownerId,
    coworkerId,
    createdAt: now,
    status: 'ACTIVE',
  });

  await batch.commit();

  return { coworkerId, inviteCode };
}

export async function claimInvite(params: {
  code: string;
  uid: string;
  name: string;
  phone?: string;
}) {
  const { code, uid, name, phone } = params;
  const inviteRef = db.collection('invites').doc(code);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists()) {
    throw new Error('Invite code not found.');
  }

  const invite = inviteSnap.data();
  if (!invite || invite.status !== 'ACTIVE' || invite.usedBy) {
    throw new Error('Invite code is no longer active.');
  }

  const coworkerRef = db.collection('coworkers').doc(invite.coworkerId);
  const userRef = db.collection('users').doc(uid);
  const now = firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.update(inviteRef, {
    status: 'USED',
    usedBy: uid,
    usedAt: now,
  });
  batch.update(coworkerRef, {
    coworkerUserId: uid,
  });
  batch.set(userRef, {
    uid,
    role: 'COWORKER',
    ownerId: invite.ownerId,
    coworkerId: invite.coworkerId,
    name,
    phone: phone || null,
    createdAt: now,
  });

  await batch.commit();
}

export async function createTransaction(params: {
  ownerId: string;
  coworkerId: string;
  createdBy: string;
  amount: number;
  type: TransactionType;
  note?: string;
  paymentMode?: string;
  referenceId?: string;
  timestamp?: Date;
  txnId?: string;
}) {
  const {
    ownerId,
    coworkerId,
    createdBy,
    amount,
    type,
    note,
    paymentMode,
    referenceId,
    timestamp,
    txnId,
  } = params;

  const id = txnId || createUuid();
  const ref = db
    .collection('coworkers')
    .doc(coworkerId)
    .collection('transactions')
    .doc(id);

  const payload: Transaction = {
    txnId: id,
    ownerId,
    coworkerId,
    createdBy,
    timestamp: firestore.Timestamp.fromDate(timestamp || new Date()),
    amount,
    type,
    note: note || null,
    paymentMode: paymentMode || null,
    referenceId: referenceId || null,
    isDeleted: false,
  };

  await ref.set(payload, { merge: false });
  return id;
}

export async function updateTransaction(params: {
  coworkerId: string;
  txnId: string;
  updates: Partial<Omit<Transaction, 'txnId' | 'ownerId' | 'coworkerId' | 'createdBy'>>;
}) {
  const { coworkerId, txnId, updates } = params;
  const ref = db
    .collection('coworkers')
    .doc(coworkerId)
    .collection('transactions')
    .doc(txnId);

  await ref.update({
    ...updates,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteTransaction(params: {
  coworkerId: string;
  txnId: string;
}) {
  const { coworkerId, txnId } = params;
  const ref = db
    .collection('coworkers')
    .doc(coworkerId)
    .collection('transactions')
    .doc(txnId);

  await ref.update({
    isDeleted: true,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/\D+/g, '').trim();
}

function assertPhoneNumber(phoneNumber: string) {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (normalized.length < 10) {
    throw new Error('Enter a valid phone number.');
  }
  return normalized;
}

function adminSessionIdentifiers(phoneNormalized: string) {
  return {
    adminId: `admin_${phoneNormalized}`,
    ledgerId: `ledger_${phoneNormalized}`,
    uid: `admin_${phoneNormalized}`,
  };
}

export async function createAdminAndLedger(params: {
  adminName: string;
  uid?: string;
  displayName?: string | null;
  email?: string | null;
  adminPhoneNormalized?: string;
}) {
  const { uid, displayName, email, adminPhoneNormalized } = params;
  const adminName = params.adminName.trim();
  if (!adminName) {
    throw new Error('Admin name is required.');
  }

  const adminId = createUuid();
  const ledgerId = createUuid();
  const now = firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  const adminRef = db.collection('admins').doc(adminId);
  const ledgerRef = db.collection('ledgers').doc(ledgerId);

  batch.set(adminRef, {
    adminId,
    adminName,
    adminPhoneNormalized: adminPhoneNormalized || null,
    createdAt: now,
  });
  batch.set(ledgerRef, {
    ledgerId,
    adminId,
    createdAt: now,
  });

  if (uid?.trim()) {
    const userRef = db.collection('users').doc(uid);
    batch.set(
      userRef,
      {
        uid,
        role: 'ADMIN',
        adminId,
        ledgerId,
        recipientId: null,
        displayName: displayName || adminName,
        email: email || null,
        createdAt: now,
        lastLoginAt: now,
      },
      { merge: true },
    );
  }

  await batch.commit();

  return { adminId, adminName, ledgerId };
}

function findWhitelistedAdmin(phoneNormalized: string) {
  return ADMIN_WHITELIST.find(
    (entry) => normalizePhoneNumber(entry.phoneNumber) === phoneNormalized,
  );
}

async function ensureAdminSessionFromWhitelist(
  phoneNormalized: string,
  adminName: string,
): Promise<AdminSession> {
  const { adminId, ledgerId, uid } = adminSessionIdentifiers(phoneNormalized);
  const adminRef = db.collection('admins').doc(adminId);
  const ledgerRef = db.collection('ledgers').doc(ledgerId);

  const [adminSnap, ledgerSnap] = await Promise.all([adminRef.get(), ledgerRef.get()]);
  const now = firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  if (!adminSnap.exists()) {
    batch.set(adminRef, {
      adminId,
      adminName,
      adminPhoneNormalized: phoneNormalized,
      createdAt: now,
    });
  }
  if (!ledgerSnap.exists()) {
    batch.set(ledgerRef, {
      ledgerId,
      adminId,
      createdAt: now,
    });
  }
  if (!adminSnap.exists() || !ledgerSnap.exists()) {
    await batch.commit();
  }

  return {
    uid,
    role: 'ADMIN',
    adminId,
    adminName: (adminSnap.data()?.adminName as string | undefined) || adminName,
    ledgerId,
  };
}

export async function createRecipientWithPhone(params: {
  ledgerId: string;
  recipientName: string;
  phoneNumber: string;
}) {
  const ledgerId = params.ledgerId.trim();
  const recipientName = params.recipientName.trim();
  const phoneNumber = params.phoneNumber.trim();
  const phoneNormalized = assertPhoneNumber(phoneNumber);

  if (!ledgerId) {
    throw new Error('Ledger is required.');
  }
  if (!recipientName) {
    throw new Error('Recipient name is required.');
  }

  return db.runTransaction(async (transaction) => {
    const phoneMappingRef = db
      .collection('recipientPhoneMappings')
      .doc(phoneNormalized);
    const existingMappingSnap = await transaction.get(phoneMappingRef);
    if (existingMappingSnap.exists()) {
      throw new Error('This phone number is already registered to a recipient.');
    }

    const recipientRef = db.collection('recipients').doc();
    const recipientId = recipientRef.id;
    const now = firestore.FieldValue.serverTimestamp();

    transaction.set(recipientRef, {
      recipientId,
      ledgerId,
      recipientName,
      phoneNumber,
      phoneNormalized,
      status: 'INVITED',
      createdAt: now,
      joinedAt: null,
      joinedUid: null,
      joinedName: null,
    });

    const phoneMapping: Omit<RecipientPhoneMapping, 'createdAt' | 'updatedAt'> = {
      phoneNormalized,
      phoneNumber,
      recipientId,
      ledgerId,
      recipientName,
    };
    transaction.set(phoneMappingRef, {
      ...phoneMapping,
      createdAt: now,
      updatedAt: now,
    });

    return { recipientId };
  });
}

export async function resolveSessionByPhone(
  phoneNumber: string,
): Promise<AppSession | null> {
  const phoneNormalized = assertPhoneNumber(phoneNumber);
  const whitelistedAdmin = findWhitelistedAdmin(phoneNormalized);
  if (whitelistedAdmin) {
    return ensureAdminSessionFromWhitelist(
      phoneNormalized,
      whitelistedAdmin.adminName.trim(),
    );
  }

  const phoneMappingRef = db
    .collection('recipientPhoneMappings')
    .doc(phoneNormalized);
  const phoneMappingSnap = await phoneMappingRef.get();
  let mapping: RecipientPhoneMapping | null = null;

  if (!phoneMappingSnap.exists()) {
    const recipientsByPhone = await db
      .collection('recipients')
      .where('phoneNormalized', '==', phoneNormalized)
      .limit(1)
      .get();
    if (recipientsByPhone.empty) {
      return null;
    }

    const fallbackRecipient = recipientsByPhone.docs[0].data() as RecipientModel;
    mapping = {
      phoneNormalized,
      phoneNumber: fallbackRecipient.phoneNumber || phoneNumber.trim(),
      recipientId: fallbackRecipient.recipientId,
      ledgerId: fallbackRecipient.ledgerId,
      recipientName: fallbackRecipient.recipientName,
      createdAt: fallbackRecipient.createdAt,
      updatedAt: fallbackRecipient.createdAt,
    };

    await phoneMappingRef.set({
      phoneNormalized,
      phoneNumber: mapping.phoneNumber,
      recipientId: mapping.recipientId,
      ledgerId: mapping.ledgerId,
      recipientName: mapping.recipientName,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } else {
    mapping = phoneMappingSnap.data() as RecipientPhoneMapping;
  }

  if (!mapping) {
    return null;
  }

  const recipientRef = db.collection('recipients').doc(mapping.recipientId);
  const recipientSnap = await recipientRef.get();
  if (!recipientSnap.exists()) {
    await phoneMappingRef.delete();
    return null;
  }

  const recipient = recipientSnap.data() as RecipientModel;
  if (recipient.ledgerId !== mapping.ledgerId) {
    return null;
  }

  if (recipient.status !== 'JOINED') {
    await recipientRef.update({
      status: 'JOINED',
      joinedAt: firestore.FieldValue.serverTimestamp(),
      joinedName: recipient.recipientName,
      joinedUid: `recipient_${phoneNormalized}`,
    });
  }

  const coworkerSession: CoworkerSession = {
    uid: `recipient_${phoneNormalized}`,
    role: 'COWORKER',
    coworkerName: recipient.recipientName,
    recipientId: recipient.recipientId,
    recipientName: recipient.recipientName,
    ledgerId: recipient.ledgerId,
  };

  return coworkerSession;
}

export async function touchUserLastLoginIfExists(params: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}) {
  const uid = params.uid.trim();
  if (!uid) {
    return false;
  }

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists()) {
    return false;
  }

  await userRef.set(
    {
      uid,
      displayName: params.displayName || null,
      email: params.email || null,
      lastLoginAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return true;
}

export async function createSharedLedgerTransaction(params: {
  ledgerId: string;
  type: SharedTransactionType;
  amount: number;
  note?: string;
}) {
  const { type } = params;
  throw new Error(
    `Shared-only transaction "${type}" is deprecated. Use recipient-specific transaction creation.`,
  );
}

export async function createRecipientLedgerTransaction(params: {
  ledgerId: string;
  recipientId: string;
  type: RecipientTransactionType;
  amount: number;
  note?: string;
  createdByUid?: string;
  txnAt?: Date;
  recipientNameSnapshot?: string;
}) {
  const {
    ledgerId,
    recipientId,
    type,
    amount,
    note,
    createdByUid,
    txnAt,
    recipientNameSnapshot,
  } = params;
  const direction: TransactionDirection = type === 'SEND' ? 'SENT' : 'RECEIVED';

  return createTransactionEntry({
    ledgerId,
    recipientId,
    direction,
    amountCents: Math.round(amount * 100),
    note,
    createdByUid: createdByUid || 'ADMIN',
    txnAt,
    recipientNameSnapshot,
  });
}

type FirestoreDocRef = FirebaseFirestoreTypes.DocumentReference<
  FirebaseFirestoreTypes.DocumentData
>;

function summarizeLedgerTransactions(transactions: LedgerTransaction[]) {
  let totalSentCents = 0;
  let totalReceivedCents = 0;
  let lastTxnAt: FirebaseFirestoreTypes.Timestamp | null = null;
  let lastTxnMillis = 0;

  transactions.forEach((transaction) => {
    if (transaction.direction === 'SENT') {
      totalSentCents += transaction.amountCents;
    } else {
      totalReceivedCents += transaction.amountCents;
    }

    const txnMillis = transaction.txnAt?.toMillis?.() || 0;
    if (txnMillis >= lastTxnMillis && transaction.txnAt) {
      lastTxnAt = transaction.txnAt;
      lastTxnMillis = txnMillis;
    }
  });

  return {
    totalSentCents,
    totalReceivedCents,
    netCents: totalSentCents - totalReceivedCents,
    lastTxnAt,
  };
}

async function refreshRecipientSummary(params: {
  recipientId: string;
  ledgerId: string;
}) {
  const { recipientId, ledgerId } = params;
  const recipientSummaryRef = db.collection('recipientSummaries').doc(recipientId);

  const transactionsSnapshot = await db
    .collection('transactions')
    .where('recipientId', '==', recipientId)
    .get();
  const transactions = transactionsSnapshot.docs.map(
    (doc) => doc.data() as LedgerTransaction,
  );

  if (transactions.length === 0) {
    await recipientSummaryRef.delete();
    return;
  }

  const summary = summarizeLedgerTransactions(transactions);
  await recipientSummaryRef.set(
    {
      recipientId,
      ledgerId,
      totalSentCents: summary.totalSentCents,
      totalReceivedCents: summary.totalReceivedCents,
      netCents: summary.netCents,
      lastTxnAt: summary.lastTxnAt,
    },
    { merge: false },
  );
}

async function refreshLedgerSummary(ledgerId: string) {
  const ledgerSummaryRef = db.collection('ledgerSummaries').doc(ledgerId);

  const transactionsSnapshot = await db
    .collection('transactions')
    .where('ledgerId', '==', ledgerId)
    .get();
  const transactions = transactionsSnapshot.docs.map(
    (doc) => doc.data() as LedgerTransaction,
  );

  if (transactions.length === 0) {
    await ledgerSummaryRef.delete();
    return;
  }

  const summary = summarizeLedgerTransactions(transactions);
  await ledgerSummaryRef.set(
    {
      ledgerId,
      totalSentCents: summary.totalSentCents,
      totalReceivedCents: summary.totalReceivedCents,
      lastTxnAt: summary.lastTxnAt,
    },
    { merge: false },
  );
}

function uniqueDocumentRefs(refs: FirestoreDocRef[]) {
  const seenPaths = new Set<string>();
  return refs.filter((ref) => {
    if (seenPaths.has(ref.path)) {
      return false;
    }
    seenPaths.add(ref.path);
    return true;
  });
}

async function deleteDocumentRefsInBatches(refs: FirestoreDocRef[]) {
  const chunkSize = 400;
  for (let index = 0; index < refs.length; index += chunkSize) {
    const batch = db.batch();
    refs.slice(index, index + chunkSize).forEach((ref) => {
      batch.delete(ref);
    });
    await batch.commit();
  }
}

export async function deleteTransactionEntry(params: { txnId: string }) {
  const txnId = params.txnId.trim();
  if (!txnId) {
    throw new Error('Transaction is required.');
  }

  const transactionRef = db.collection('transactions').doc(txnId);
  const transactionSnapshot = await transactionRef.get();
  if (!transactionSnapshot.exists()) {
    throw new Error('Transaction not found.');
  }

  const transaction = transactionSnapshot.data() as LedgerTransaction;
  await transactionRef.delete();

  try {
    await Promise.all([
      refreshRecipientSummary({
        recipientId: transaction.recipientId,
        ledgerId: transaction.ledgerId,
      }),
      refreshLedgerSummary(transaction.ledgerId),
    ]);
  } catch (error) {
    console.warn('Transaction deleted, but summary refresh failed.', error);
  }
}

export async function deleteRecipientEntry(params: { recipientId: string }) {
  const recipientId = params.recipientId.trim();
  if (!recipientId) {
    throw new Error('Recipient is required.');
  }

  const recipientRef = db.collection('recipients').doc(recipientId);
  const recipientSnapshot = await recipientRef.get();
  if (!recipientSnapshot.exists()) {
    throw new Error('Recipient not found.');
  }

  const recipient = recipientSnapshot.data() as RecipientModel;
  const transactionsSnapshot = await db
    .collection('transactions')
    .where('recipientId', '==', recipientId)
    .get();
  const phoneMappingSnapshot = await db
    .collection('recipientPhoneMappings')
    .where('recipientId', '==', recipientId)
    .get();

  const refsToDelete: FirestoreDocRef[] = [
    recipientRef,
    db.collection('recipientSummaries').doc(recipientId),
  ];

  if (recipient.phoneNormalized?.trim()) {
    refsToDelete.push(
      db.collection('recipientPhoneMappings').doc(recipient.phoneNormalized),
    );
  }

  transactionsSnapshot.docs.forEach((doc) => {
    refsToDelete.push(doc.ref);
  });

  phoneMappingSnapshot.docs.forEach((doc) => {
    refsToDelete.push(doc.ref);
  });

  await deleteDocumentRefsInBatches(uniqueDocumentRefs(refsToDelete));

  try {
    await refreshLedgerSummary(recipient.ledgerId);
  } catch (error) {
    console.warn('Recipient deleted, but ledger summary refresh failed.', error);
  }
}

export async function createTransactionEntry(params: {
  ledgerId: string;
  recipientId: string;
  direction: TransactionDirection;
  amountCents: number;
  note?: string;
  txnAt?: Date;
  createdByUid: string;
  recipientNameSnapshot?: string;
}) {
  const {
    ledgerId,
    recipientId,
    direction,
    amountCents,
    note,
    txnAt,
    createdByUid,
    recipientNameSnapshot,
  } = params;
  if (!ledgerId.trim()) {
    throw new Error('Ledger is required.');
  }
  if (!recipientId.trim()) {
    throw new Error('Recipient is required.');
  }
  if (!amountCents || amountCents <= 0) {
    throw new Error('Amount must be greater than zero cents.');
  }
  if (!createdByUid.trim()) {
    throw new Error('createdByUid is required.');
  }

  const writeResult = await db.runTransaction(async (transaction) => {
    const recipientRef = db.collection('recipients').doc(recipientId);
    const recipientSnap = await transaction.get(recipientRef);
    if (!recipientSnap.exists()) {
      throw new Error('Recipient not found.');
    }

    const recipient = recipientSnap.data() as RecipientModel;
    if (recipient.ledgerId !== ledgerId) {
      throw new Error('Recipient does not belong to this ledger.');
    }

    const snapshotName =
      recipientNameSnapshot?.trim() || recipient.recipientName || 'Recipient';
    const txnId = createUuid();
    const transactionRef = db.collection('transactions').doc(txnId);
    const txnAtTimestamp = firestore.Timestamp.fromDate(txnAt || new Date());
    const createdAtTimestamp = firestore.FieldValue.serverTimestamp();

    const payload: LedgerTransaction = {
      txnId,
      ledgerId,
      recipientId,
      direction,
      amountCents,
      note: note || null,
      txnAt: txnAtTimestamp,
      createdAt: txnAtTimestamp,
      createdByUid,
      createdByRole: 'ADMIN',
      recipientNameSnapshot: snapshotName,
    };

    transaction.set(transactionRef, {
      ...payload,
      createdAt: createdAtTimestamp,
    });

    const sentDelta = direction === 'SENT' ? amountCents : 0;
    const receivedDelta = direction === 'RECEIVED' ? amountCents : 0;
    const netDelta = direction === 'SENT' ? amountCents : -amountCents;

    return {
      txnId,
      sentDelta,
      receivedDelta,
      netDelta,
      txnAtTimestamp,
    };
  });

  const recipientSummaryRef = db.collection('recipientSummaries').doc(recipientId);
  const ledgerSummaryRef = db.collection('ledgerSummaries').doc(ledgerId);
  const recipientSummaryPayload: Record<string, unknown> = {
    recipientId,
    ledgerId,
    totalSentCents: firestore.FieldValue.increment(writeResult.sentDelta),
    totalReceivedCents: firestore.FieldValue.increment(writeResult.receivedDelta),
    netCents: firestore.FieldValue.increment(writeResult.netDelta),
    lastTxnAt: writeResult.txnAtTimestamp,
  };
  const ledgerSummaryPayload: Record<string, unknown> = {
    ledgerId,
    totalSentCents: firestore.FieldValue.increment(writeResult.sentDelta),
    totalReceivedCents: firestore.FieldValue.increment(writeResult.receivedDelta),
    lastTxnAt: writeResult.txnAtTimestamp,
  };

  try {
    await Promise.all([
      recipientSummaryRef.set(recipientSummaryPayload, { merge: true }),
      ledgerSummaryRef.set(ledgerSummaryPayload, { merge: true }),
    ]);
  } catch (error) {
    console.warn('Transaction saved, but summary update failed.', error);
  }

  return writeResult.txnId;
}
