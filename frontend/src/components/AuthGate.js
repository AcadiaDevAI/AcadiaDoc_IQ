import React from "react";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";

const CLERK_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

/**
 * AuthGate
 * - No Clerk key → renders children directly (no auth)
 * - Clerk signed-out → shows Clerk's built-in SignIn component (white page)
 * - Clerk signed-in → renders children (the app)
 *
 * NOTE: This uses @clerk/clerk-react@5.17.0 which is compatible with React 18 + CRA.
 * Versions 5.50+ use async internal components that crash with React 18.
 */
export default function AuthGate({ children }) {
  if (!CLERK_KEY) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedOut>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
          }}
        >
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>{children}</SignedIn>
    </>
  );
}