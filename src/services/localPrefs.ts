import RNFS from 'react-native-fs';

interface AppPrefs {
  lastPhoneLocalNumber?: string;
}

const PREFS_PATH = `${RNFS.DocumentDirectoryPath}/app_prefs.json`;

function sanitizeLocalPhone(phoneValue: string) {
  return phoneValue.replace(/\D+/g, '').trim();
}

async function readPrefs(): Promise<AppPrefs> {
  try {
    const exists = await RNFS.exists(PREFS_PATH);
    if (!exists) {
      return {};
    }
    const raw = await RNFS.readFile(PREFS_PATH, 'utf8');
    if (!raw.trim()) {
      return {};
    }
    const parsed = JSON.parse(raw) as AppPrefs;
    return parsed || {};
  } catch {
    return {};
  }
}

async function writePrefs(nextPrefs: AppPrefs) {
  await RNFS.writeFile(PREFS_PATH, JSON.stringify(nextPrefs), 'utf8');
}

export async function getLastLoginPhoneLocalNumber() {
  const prefs = await readPrefs();
  const phone = sanitizeLocalPhone(prefs.lastPhoneLocalNumber || '');
  if (phone.length === 10) {
    return phone;
  }
  return null;
}

export async function saveLastLoginPhoneLocalNumber(phoneValue: string) {
  const phone = sanitizeLocalPhone(phoneValue);
  if (phone.length !== 10) {
    return;
  }
  const prefs = await readPrefs();
  await writePrefs({
    ...prefs,
    lastPhoneLocalNumber: phone,
  });
}
