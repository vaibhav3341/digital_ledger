import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export async function sendOtp(phoneNumber: string) {
  return auth().signInWithPhoneNumber(phoneNumber);
}

export async function confirmOtp(
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  code: string,
) {
  return confirmation.confirm(code);
}

export function signOut() {
  return auth().signOut();
}
