import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ImpersonationBanner from "@/components/ui/ImpersonationBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: {
    template: "%s | eSchoolKart",
    default: "eSchoolKart — School Uniform Ordering System",
  },
  description:
    "eSchoolKart.com — The premier multi-vendor school uniform ordering platform connecting schools, vendors, and parents.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <ImpersonationBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
