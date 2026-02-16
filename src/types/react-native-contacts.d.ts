declare module 'react-native-contacts' {
  export interface ContactPhoneNumber {
    label?: string;
    number?: string | null;
  }

  export interface Contact {
    recordID?: string;
    givenName?: string;
    familyName?: string;
    displayName?: string;
    phoneNumbers?: ContactPhoneNumber[];
  }

  export interface ContactsModule {
    getAll: () => Promise<Contact[]>;
  }

  const Contacts: ContactsModule;
  export default Contacts;
}
