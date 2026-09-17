// Explicitly opt in for a development server. Never enabled in a production build.
export const LOCAL_ACCOUNT_MODE = process.env.NODE_ENV === "development"
  && process.env.NEXT_PUBLIC_LOCAL_ACCOUNT_TEST === "1";
