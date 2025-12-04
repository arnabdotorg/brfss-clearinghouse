import "./globals.css";

export const metadata = {
  title: "Gemini + DuckDB SQL Playground",
  description:
    "Upload CSVs, ask Gemini for SQL, and query with DuckDB all in your browser.",
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
