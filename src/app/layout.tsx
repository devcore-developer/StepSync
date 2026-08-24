import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/providers/session-provider";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "StepSync",
    template: "%s | StepSync",
  },
  description:
    "منصة ذكية لإعداد خطط الدراسة لامتحان USMLE مع شركاء دراسة ومجموعات تعاونية — Alexandria University",
  keywords: ["USMLE", "study plan", "study partner", "medical education", "StepSync", "إعداد دراسي", "خطط دراسة"],
  authors: [{ name: "StepSync Team" }],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "StepSync — خطتك الدراسية للـ USMLE",
    description: "منصة ذكية لإعداد خطط الدراسة لامتحان USMLE مع شركاء دراسة ومجموعات تعاونية",
    type: "website",
    locale: "ar_EG",
    siteName: "StepSync",
  },
  twitter: {
    card: "summary_large_image",
    title: "StepSync — خطتك الدراسية للـ USMLE",
    description: "منصة ذكية لإعداد خطط الدراسة لامتحان USMLE",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}