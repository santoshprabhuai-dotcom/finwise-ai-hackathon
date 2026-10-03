import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Music Room — your music, your space",
  description: "A personal music room for YouTube listening, favorites, and playlists.",
  applicationName: "My Music Room",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
