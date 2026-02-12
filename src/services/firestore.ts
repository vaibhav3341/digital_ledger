import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {
  AccessCode,
  LedgerTransaction,
  Recipient as RecipientModel,
  TransactionDirection,
  RecipientTransactionType,
  SharedTransactionType,
  Transaction,
  TransactionType,
  ValidatedAccessCode,
} from '../models/types';
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

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function createUniqueAccessCode(
  transaction: FirebaseFirestoreTypes.Transaction,
) {
  for (let i = 0; i < 10; i += 1) {
    const code = generateInviteCode();
    const codeRef = db.collection('accessCodes').doc(code);
    const existing = await transaction.get(codeRef);
    if (!existing.exists()) {
      return code;
    }
  }
  throw new Error('Unable to generate unique access code. Please try again.');
}

export async function createAdminAndLedger(params: {
  adminName: string;
  uid: string;
  displayName?: string | null;
  email?: string | null;
}) {
  const { uid, displayName, email } = params;
  const adminName = params.adminName.trim();
  if (!uid.trim()) {
    throw new Error('Signed-in user is required.');
  }
  if (!adminName) {
    throw new Error('Admin name is required.');
  }

  const adminId = createUuid();
  const ledgerId = createUuid();
  const now = firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  const adminRef = db.collection('admins').doc(adminId);
  const ledgerRef = db.collection('ledgers').doc(ledgerId);
  const userRef = db.collection('users').doc(uid);

  batch.set(adminRef, {
    adminId,
    adminName,
    createdAt: now,
  });
  batch.set(ledgerRef, {
    ledgerId,
    adminId,
    createdAt: now,
  });
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

  await batch.commit();

  return { adminId, adminName, ledgerId };
}

export async function validateRecipientAccessCode(
  code: string,
): Promise<ValidatedAccessCode> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error('Access code is required.');
  }

  const codeRef = db.collection('accessCodes').doc(normalizedCode);
  const codeSnap = await codeRef.get();
  if (!codeSnap.exists()) {
    throw new Error('Access code not found.');
  }

  const codeData = codeSnap.data() as AccessCode;
  if (codeData.status !== 'ACTIVE' && codeData.status !== 'USED') {
    throw new Error('Access code is not active.');
  }

  const recipientRef = db.collection('recipients').doc(codeData.recipientId);
  const recipientSnap = await recipientRef.get();
  if (!recipientSnap.exists()) {
    throw new Error('Recipient slot not found for this code.');
  }

  const recipient = recipientSnap.data() as RecipientModel;
  if (recipient.ledgerId !== codeData.ledgerId) {
    throw new Error('Access code mapping is invalid.');
  }

  return {
    code: normalizedCode,
    ledgerId: codeData.ledgerId,
    recipientId: codeData.recipientId,
    recipientName: recipient.recipientName,
    status: codeData.status,
    joinedName: codeData.joinedName || null,
    joinedNameNormalized: codeData.joinedNameNormalized || null,
  };
}

export async function registerCoworkerFromAccessCode(params: {
  code: string;
  coworkerName: string;
  uid: string;
  displayName?: string | null;
  email?: string | null;
}) {
  const normalizedCode = params.code.trim().toUpperCase();
  const coworkerName = params.coworkerName.trim();
  const normalizedCoworkerName = normalizeName(coworkerName);
  const uid = params.uid.trim();

  if (!normalizedCode) {
    throw new Error('Access code is required.');
  }
  if (!coworkerName) {
    throw new Error('Name is required.');
  }
  if (!uid) {
    throw new Error('Signed-in user is required.');
  }

  return db.runTransaction(async (transaction) => {
    const codeRef = db.collection('accessCodes').doc(normalizedCode);
    const codeSnap = await transaction.get(codeRef);
    if (!codeSnap.exists()) {
      throw new Error('Access code not found.');
    }

    const codeData = codeSnap.data() as AccessCode;
    if (codeData.status !== 'ACTIVE' && codeData.status !== 'USED') {
      throw new Error('Access code is not active.');
    }

    const recipientRef = db.collection('recipients').doc(codeData.recipientId);
    const recipientSnap = await transaction.get(recipientRef);
    if (!recipientSnap.exists()) {
      throw new Error('Recipient slot not found.');
    }

    const recipient = recipientSnap.data() as RecipientModel;
    if (recipient.ledgerId !== codeData.ledgerId) {
      throw new Error('Access code mapping is invalid.');
    }

    if (
      codeData.status === 'USED' &&
      codeData.usedByUid &&
      codeData.usedByUid !== uid
    ) {
      throw new Error('This access code is already linked to another account.');
    }

    if (
      codeData.status === 'USED' &&
      !codeData.usedByUid &&
      codeData.joinedNameNormalized &&
      codeData.joinedNameNormalized !== normalizedCoworkerName
    ) {
      throw new Error('This access code is already linked to another name.');
    }

    const now = firestore.FieldValue.serverTimestamp();
    const accessCodeUpdates: Record<string, unknown> = {};

    if (codeData.status === 'ACTIVE') {
      accessCodeUpdates.status = 'USED';
      accessCodeUpdates.usedAt = now;
    }
    if (!codeData.usedByUid) {
      accessCodeUpdates.usedByUid = uid;
    }
    if (!codeData.joinedNameNormalized) {
      accessCodeUpdates.joinedName = coworkerName;
      accessCodeUpdates.joinedNameNormalized = normalizedCoworkerName;
    }
    if (Object.keys(accessCodeUpdates).length > 0) {
      transaction.update(codeRef, accessCodeUpdates);
    }

    const recipientUpdates: Record<string, unknown> = {
      status: 'JOINED',
      joinedUid: uid,
      joinedName: coworkerName,
    };
    if (!recipient.joinedAt) {
      recipientUpdates.joinedAt = now;
    }
    transaction.update(recipientRef, recipientUpdates);

    const userRef = db.collection('users').doc(uid);
    const userSnap = await transaction.get(userRef);
    const existingCreatedAt = userSnap.exists()
      ? (userSnap.data()?.createdAt ?? now)
      : now;

    transaction.set(
      userRef,
      {
        uid,
        role: 'COWORKER',
        adminId: null,
        ledgerId: codeData.ledgerId,
        recipientId: recipient.recipientId,
        displayName: params.displayName || coworkerName,
        email: params.email || null,
        createdAt: existingCreatedAt,
        lastLoginAt: now,
      },
      { merge: true },
    );

    return {
      code: normalizedCode,
      ledgerId: codeData.ledgerId,
      recipientId: recipient.recipientId,
      recipientName: recipient.recipientName,
    };
  });
}

export async function createRecipientWithAccessCode(params: {
  ledgerId: string;
  recipientName: string;
}) {
  const ledgerId = params.ledgerId.trim();
  const recipientName = params.recipientName.trim();
  if (!ledgerId) {
    throw new Error('Ledger is required.');
  }
  if (!recipientName) {
    throw new Error('Recipient name is required.');
  }

  return db.runTransaction(async (transaction) => {
    const recipientRef = db.collection('recipients').doc();
    const recipientId = recipientRef.id;
    const code = await createUniqueAccessCode(transaction);
    const codeRef = db.collection('accessCodes').doc(code);
    const now = firestore.FieldValue.serverTimestamp();

    transaction.set(recipientRef, {
      recipientId,
      ledgerId,
      recipientName,
      status: 'INVITED',
      createdAt: now,
      joinedAt: null,
      joinedUid: null,
      joinedName: null,
    });

    transaction.set(codeRef, {
      code,
      recipientId,
      ledgerId,
      status: 'ACTIVE',
      createdAt: now,
      usedAt: null,
      usedByUid: null,
      joinedName: null,
      joinedNameNormalized: null,
    });

    return { recipientId, code };
  });
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
