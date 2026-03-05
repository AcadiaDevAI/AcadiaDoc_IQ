import React from "react";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";

const CLERK_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

/**
 * AuthGate wraps the entire app.
 * - No Clerk key → renders children directly (no auth)
 * - Clerk configured + signed-out → full Clerk SignIn page
 * - Clerk configured + signed-in → renders children (the app)
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
          <SignIn
            routing="hash"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl rounded-2xl",
              },
            }}
          />
        </div>
      </SignedOut>

      <SignedIn>{children}</SignedIn>
    </>
  );
}
