"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CacheProvider } from "@emotion/react";
import { emotionCache } from "@/lib/emotion-cache";
import React from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </CacheProvider>
  );
}
