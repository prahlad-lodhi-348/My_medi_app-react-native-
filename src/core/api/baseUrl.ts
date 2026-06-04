import Config from 'react-native-config';

export const getBaseUrl = (): string => {
  const url = Config.API_URL || Config.BASE_URL || '';
  // Ensure trailing slash consistency.
  if (!url) return '';
  return url.endsWith('/') ? url : `${url}/`;
};

