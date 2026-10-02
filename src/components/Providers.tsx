"use client";

import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { StoreProvider } from "@/context/CartContext";
import { captureUtmFromLocation } from "@/lib/utm";

function UtmCapture() {
  useEffect(() => {
    captureUtmFromLocation();
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <StoreProvider>
        <UtmCapture />
        {children}
      </StoreProvider>
    </ThemeProvider>
  );
}
