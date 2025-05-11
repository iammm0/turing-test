import "./globals.css";
import { Providers } from "./providers";
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="zh">
      <head>
          <title>图灵测试</title>
      </head>
      <body>
      <Providers>{children}</Providers>
      </body>
      </html>
  );
}
