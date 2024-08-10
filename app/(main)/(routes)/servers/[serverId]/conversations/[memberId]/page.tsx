// app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx

import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import ClientMemberChatPage from "@/components/chat/client-member-chat-page";
import ChatMemberPage from "@/components/chat/chat-member-page";
interface MemberIdPageProps {
  params: {
    memberId: string;
    serverId: string;
  },
  searchParams: {
    video?: boolean;
  }
}

const MemberIdPage = async ({
  params,
  searchParams,
}: MemberIdPageProps) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirectToSignIn();
  }

  const currentMember = await db.member.findFirst({
    where: {
      serverId: params.serverId,
      profileId: profile.id,
    },
    include: {
      profile: true,
    },
  });

  if (!currentMember) {
    return redirect("/");
  }

  const conversation = await getOrCreateConversation(currentMember.id, params.memberId);

  if (!conversation) {
    return redirect(`/servers/${params.serverId}`);
  }

  const { memberOne, memberTwo } = conversation;

  const otherMember = memberOne.profileId === profile.id ? memberTwo : memberOne;

  const messages = await db.directMessage.findMany({
    where: {
      conversationId: conversation.id,
    },
    select: {
      id: true,
      content: true,
    },
  });

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
    <ChatMemberPage
      serverId={params.serverId}
      conversationId={conversation.id}
      member={currentMember}
      otherMember={otherMember}
      messages={messages}
      searchParams={searchParams}
    />
    </div>
  );
};

export default MemberIdPage;
