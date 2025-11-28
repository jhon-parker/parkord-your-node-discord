import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserStatusIndicator from "@/components/UserStatusIndicator";
import UserProfileCard from "@/components/UserProfileCard";

interface Member {
  id: string;
  username: string;
  status: string;
  avatar_url?: string;
}

interface MemberListProps {
  members: Member[];
  onStartDM?: (userId: string, username: string) => void;
}

const MemberList = ({ members, onStartDM }: MemberListProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const onlineMembers = members.filter((m) => m.status === "online" || m.status === "idle" || m.status === "dnd");
  const offlineMembers = members.filter((m) => m.status === "offline" || !m.status);

  const MemberItem = ({ member, isOnline }: { member: Member; isOnline: boolean }) => (
    <div
      onClick={() => setSelectedUserId(member.id)}
      className={`flex items-center gap-3 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer ${!isOnline ? "opacity-60" : ""}`}
    >
      <div className="relative">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {member.username[0]?.toUpperCase() || "U"}
          </div>
        )}
        <UserStatusIndicator
          status={isOnline ? member.status : "offline"}
          className="absolute -bottom-0.5 -right-0.5 border-2 border-secondary"
        />
      </div>
      <span className="text-sm text-foreground">{member.username}</span>
    </div>
  );

  return (
    <div className="w-60 bg-secondary border-l border-border">
      <div className="p-4">
        <ScrollArea className="h-[calc(100vh-2rem)]">
          {onlineMembers.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">
                В сети — {onlineMembers.length}
              </h3>
              <div className="space-y-2 mb-6">
                {onlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} isOnline={true} />
                ))}
              </div>
            </>
          )}

          {offlineMembers.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">
                Не в сети — {offlineMembers.length}
              </h3>
              <div className="space-y-2">
                {offlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} isOnline={false} />
                ))}
              </div>
            </>
          )}
        </ScrollArea>
      </div>

      {selectedUserId && (
        <UserProfileCard
          userId={selectedUserId}
          open={!!selectedUserId}
          onOpenChange={(open) => !open && setSelectedUserId(null)}
          onStartDM={onStartDM}
        />
      )}
    </div>
  );
};

export default MemberList;
