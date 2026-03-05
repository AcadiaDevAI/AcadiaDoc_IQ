import React, { createContext, useContext, useState, useCallback } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light"); // "light" | "dark"

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const isDark = mode === "dark";

  const value = React.useMemo(
    () => ({ mode, isDark, toggleTheme }),
    [mode, isDark, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className={isDark ? "theme-dark" : "theme-light"}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
