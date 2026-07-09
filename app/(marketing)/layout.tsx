import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatProvider } from "@/components/chatbot/useChat";
import { LazyChatWindow } from "@/components/chatbot/LazyChatWindow";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <LazyChatWindow />
    </ChatProvider>
  );
}
