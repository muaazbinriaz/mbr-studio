import { AuthSplitLayout } from "@/components/platform/AuthSplitLayout";

export default function PlatformAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSplitLayout>{children}</AuthSplitLayout>;
}
