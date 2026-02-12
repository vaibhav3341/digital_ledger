import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '901885032578-4dcsrti5jis4nlef76msmnltvupeld27.apps.googleusercontent.com';
let googleConfigured = false;

export function configureGoogleSignIn() {
  if (googleConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
  googleConfigured = true;
}

export async function sendOtp(phoneNumber: string) {
  return auth().signInWithPhoneNumber(phoneNumber);
}

export async function confirmOtp(
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  code: string,
) {
  return confirmation.confirm(code);
}

export async function signInWithGoogle() {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken =
    (signInResult as { idToken?: string })?.idToken ||
    (signInResult as { data?: { idToken?: string } })?.data?.idToken;

  if (!idToken) {
    throw new Error(
      'Google Sign-In did not return an idToken. Verify `GOOGLE_WEB_CLIENT_ID` in src/services/auth.ts.',
    );
  }

  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  await auth().signInWithCredential(googleCredential);
}

export async function signOut() {
  await auth().signOut();
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.warn('Google sign-out skipped.', error);
  }
}
