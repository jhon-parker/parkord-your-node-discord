import { ScrollArea } from "@/components/ui/scroll-area";
import UserStatusIndicator from "@/components/UserStatusIndicator";

interface Member {
  id: string;
  username: string;
  status: string;
  avatar_url?: string;
}

interface MemberListProps {
  members: Member[];
}

const MemberList = ({ members }: MemberListProps) => {
  const onlineMembers = members.filter((m) => m.status === "online" || m.status === "idle" || m.status === "dnd");
  const offlineMembers = members.filter((m) => m.status === "offline" || !m.status);

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
                  <div key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer">
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
                        status={member.status}
                        className="absolute -bottom-0.5 -right-0.5 border-2 border-secondary"
                      />
                    </div>
                    <span className="text-sm text-foreground">{member.username}</span>
                  </div>
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
                  <div key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer opacity-60">
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
                        status="offline"
                        className="absolute -bottom-0.5 -right-0.5 border-2 border-secondary"
                      />
                    </div>
                    <span className="text-sm text-foreground">{member.username}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default MemberList;
