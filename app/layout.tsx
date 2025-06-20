import type { Metadata } from "next";
import './globals.css';
import { Roboto, Open_Sans } from 'next/font/google';
import { Navbar } from "./navbar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AuthProvider from "./auth-provider";

const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'] });
const openSans = Open_Sans({ weight: ['400', '600'], subsets: ['latin'] });

export const metadata: Metadata = {
  title: "OpenEvidence Toy Frontend",
  description: "Good luck!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession(authOptions); // runs only on the server

  return (
    <html lang="en">
      <body className={`${roboto.className} ${openSans.className}`}>
        <AuthProvider session={session}>   
          <Navbar/>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
