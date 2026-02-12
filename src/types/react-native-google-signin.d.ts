declare module '@react-native-google-signin/google-signin' {
  export const GoogleSignin: {
    configure: (options: {
      webClientId?: string;
      scopes?: string[];
      offlineAccess?: boolean;
    }) => void;
    hasPlayServices: (options?: {
      showPlayServicesUpdateDialog?: boolean;
    }) => Promise<boolean>;
    signIn: () => Promise<{
      idToken?: string;
      data?: {
        idToken?: string;
      };
    }>;
    signOut: () => Promise<void>;
  };
}
