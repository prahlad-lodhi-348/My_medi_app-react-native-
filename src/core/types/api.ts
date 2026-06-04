export type ApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'network'
  | 'unknown';

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  details?: unknown;
};

