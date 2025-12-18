import "./globals.css";

export const metadata = {
  title: "BRFSS Clearinghouse",
  description:
    "BRFSS data clearinghouse with Google Gemini integration for SQL querying and built-in pivot table.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
