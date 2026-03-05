import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setTokenGetter } from "../services/api";

const CLERK_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

/**
 * useAuthInterceptor
 *
 * Call this once in a top-level component (inside ClerkProvider).
 * It registers Clerk's getToken function so that every axios
 * request automatically includes Authorization: Bearer <token>.
 *
 * If Clerk is not configured, this is a no-op.
 */
export default function useAuthInterceptor() {
  // Only call useAuth if Clerk is configured
  // (useAuth will throw if used outside ClerkProvider)
  if (!CLERK_KEY) {
    return { isLoaded: true, isSignedIn: false, userId: null };
  }

  return useAuthInterceptorInner();
}

function useAuthInterceptorInner() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn && getToken) {
      setTokenGetter(() => getToken());
    } else {
      setTokenGetter(null);
    }

    return () => setTokenGetter(null);
  }, [isLoaded, isSignedIn, getToken]);

  return { isLoaded, isSignedIn, userId };
}
