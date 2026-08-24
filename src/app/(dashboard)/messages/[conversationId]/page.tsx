import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getConversation } from "@/actions/student/messages";
import ConversationView from "@/components/shared/conversation-view";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { conversationId } = await params;
  const conversation = await getConversation(conversationId);

  if (!conversation) notFound();

  return (
    <ConversationView
      conversation={conversation}
      currentUserId={session.user.id}
    />
  );
}