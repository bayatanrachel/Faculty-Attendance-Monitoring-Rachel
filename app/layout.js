
import "./globals.css";

export const metadata = {
  title: "Faculty Attendance System",
  description: "QR Code-Based Attendance Monitoring System for Sherilyn Tobias",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

