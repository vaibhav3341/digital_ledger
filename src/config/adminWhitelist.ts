export interface AdminWhitelistEntry {
  phoneNumber: string;
  adminName: string;
}

/**
 * Update this list with admin phone numbers.
 * Format can be with/without + and spaces; app normalizes before matching.
 */
export const ADMIN_WHITELIST: AdminWhitelistEntry[] = [
  {
    phoneNumber: '+91 9161293962',
    adminName: 'Vaibhav',
  },
  {
    phoneNumber: '+91 7379988020',
    adminName: 'Ekta Gupta',
  },
  {
    phoneNumber: '+91 9918539222',
    adminName: 'Ram Babu Gupta',
  },
];
