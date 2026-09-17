// Keep local-test opt-in for dev, but allow the deployed app to use the
// account-management flow while we finish the role sync rollout.
export const LOCAL_ACCOUNT_MODE = process.env.NODE_ENV !== "production"
  ? process.env.NEXT_PUBLIC_LOCAL_ACCOUNT_TEST === "1"
  : true;
