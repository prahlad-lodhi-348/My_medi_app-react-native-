import * as Keychain from 'react-native-keychain';

const SERVICE = 'auth_token';

export const saveToken = async (token: string): Promise<void> => {
  await Keychain.setGenericPassword(SERVICE, token);
};

export const getToken = async (): Promise<string | null> => {
  const res = await Keychain.getGenericPassword();
  if (!res) return null;
  return res.password;
};

export const clearToken = async (): Promise<void> => {
  await Keychain.resetGenericPassword();
};

