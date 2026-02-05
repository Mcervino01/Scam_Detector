import { ChatInterface } from "@/components/chat/ChatInterface";
import { getClientSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await getClientSession();
  if (!session) {
    redirect("/");
  }

  return <ChatInterface />;
}
