export const getApiErrorMessage = (error: unknown): string | undefined =>
  (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
