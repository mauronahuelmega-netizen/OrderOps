import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "OrderOps",
  description: "OrderOps",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", type: "image/x-icon" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "192x192" }
    ],
    shortcut: "/favicon.ico?v=2"
  }
};

const adminThemeBootstrapScript = `
(function () {
  try {
    var path = window.location && window.location.pathname ? window.location.pathname : "";
    if (!path.startsWith("/admin")) return;
    var storedTheme = window.localStorage.getItem("orderops-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      document.documentElement.setAttribute("data-dashboard-theme", storedTheme);
      document.documentElement.style.colorScheme = storedTheme;
    }
  } catch (_) {}
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: adminThemeBootstrapScript }}
        />
        {children}
      </body>
    </html>
  );
}
