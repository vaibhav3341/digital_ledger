import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type UserRole = 'OWNER' | 'COWORKER';

export type TransactionType = 'PAID_TO_COWORKER' | 'RECEIVED_FROM_COWORKER';

export type CoworkerStatus = 'ACTIVE' | 'INACTIVE';

export interface UserProfile {
  uid: string;
  role: UserRole;
  ownerId?: string;
  coworkerId?: string;
  name?: string;
  phone?: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Coworker {
  id: string;
  ownerId: string;
  coworkerUserId?: string | null;
  name: string;
  phone?: string | null;
  status: CoworkerStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Transaction {
  txnId: string;
  ownerId: string;
  coworkerId: string;
  createdBy: string;
  timestamp: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
  amount: number;
  type: TransactionType;
  note?: string | null;
  paymentMode?: string | null;
  referenceId?: string | null;
  isDeleted?: boolean;
}

export interface Invite {
  code: string;
  ownerId: string;
  coworkerId: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  expiresAt?: FirebaseFirestoreTypes.Timestamp;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  usedBy?: string;
  usedAt?: FirebaseFirestoreTypes.Timestamp;
}

export type AppRole = 'ADMIN' | 'COWORKER';

export type RecipientStatus = 'INVITED' | 'JOINED';

export type AccessCodeStatus = 'ACTIVE' | 'USED';

export type SharedTransactionType = 'ADD' | 'SEND' | 'RECEIVE';

export type RecipientTransactionType = 'SEND' | 'RECEIVE';

export type TransactionDirection = 'SENT' | 'RECEIVED';

export interface AdminProfile {
  adminId: string;
  adminName: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Ledger {
  ledgerId: string;
  adminId: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Recipient {
  recipientId: string;
  ledgerId: string;
  recipientName: string;
  status: RecipientStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  joinedAt?: FirebaseFirestoreTypes.Timestamp | null;
  joinedName?: string | null;
}

export interface AccessCode {
  code: string;
  recipientId: string;
  ledgerId: string;
  status: AccessCodeStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  usedAt?: FirebaseFirestoreTypes.Timestamp | null;
  joinedName?: string | null;
  joinedNameNormalized?: string | null;
}

export interface SharedLedgerTransaction {
  txnId: string;
  ledgerId: string;
  type: SharedTransactionType;
  amount: number;
  note?: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  createdBy: 'ADMIN';
}

export interface RecipientLedgerTransaction {
  txnId: string;
  ledgerId: string;
  recipientId: string;
  type: RecipientTransactionType;
  amount: number;
  note?: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  createdBy: 'ADMIN';
}

export interface LedgerTransaction {
  txnId: string;
  ledgerId: string;
  recipientId: string;
  direction: TransactionDirection;
  amountCents: number;
  note?: string | null;
  txnAt: FirebaseFirestoreTypes.Timestamp;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  createdByUid: string;
  createdByRole: 'ADMIN';
  recipientNameSnapshot: string;
}

export interface RecipientSummary {
  recipientId: string;
  ledgerId: string;
  netCents: number;
  totalSentCents: number;
  totalReceivedCents: number;
  lastTxnAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export interface LedgerSummary {
  ledgerId: string;
  totalSentCents: number;
  totalReceivedCents: number;
  lastTxnAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export interface ValidatedAccessCode {
  code: string;
  ledgerId: string;
  recipientId: string;
  recipientName: string;
  status: AccessCodeStatus;
  joinedName?: string | null;
  joinedNameNormalized?: string | null;
}

export interface AdminSession {
  role: 'ADMIN';
  adminId: string;
  adminName: string;
  ledgerId: string;
}

export interface CoworkerSession {
  role: 'COWORKER';
  coworkerName: string;
  recipientId: string;
  recipientName: string;
  ledgerId: string;
  accessCode: string;
}

export type AppSession = AdminSession | CoworkerSession;
