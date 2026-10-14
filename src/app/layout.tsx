import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resource Reservation",
  description: "Manage shared resources and reservations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <span className="brand">Resource Reservation</span>
          <Link href="/">Dashboard</Link>
          <Link href="/reservations">Reservations</Link>
          <Link href="/resources">Resources</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}