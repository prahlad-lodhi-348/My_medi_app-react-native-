declare module 'react-native-config' {
  const Config: Record<string, string | undefined> & {
    API_URL?: string;
    BASE_URL?: string;
  };
  export default Config;
}

