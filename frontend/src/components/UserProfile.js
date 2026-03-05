import React from "react";
import { SignedIn, UserButton, useUser } from "@clerk/clerk-react";

const CLERK_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

export default function UserProfile() {
  if (!CLERK_KEY) return null;

  return (
    <SignedIn>
      <UserInfo />
    </SignedIn>
  );
}

function UserInfo() {
  const { user, isLoaded } = useUser();

  const email =
    isLoaded && user
      ? user.primaryEmailAddress?.emailAddress || user.fullName || "User"
      : "Loading...";

  const displayName =
    isLoaded && user
      ? user.fullName || user.firstName || email.split("@")[0]
      : "";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-t"
      style={{ borderColor: "var(--border-color)" }}
    >
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
            userButtonTrigger: "focus:shadow-none",
          },
        }}
        afterSignOutUrl="/"
      />
      <div className="min-w-0 flex-1">
        {displayName && (
          <p className="text-xs t-text font-medium truncate">{displayName}</p>
        )}
        <p className="text-[11px] t-text-muted truncate">{email}</p>
      </div>
    </div>
  );
}
