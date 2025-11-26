import { ScrollArea } from "@/components/ui/scroll-area";

interface Member {
  id: string;
  username: string;
  status: "online" | "offline";
}

interface MemberListProps {
  members: Member[];
}

const MemberList = ({ members }: MemberListProps) => {
  return (
    <div className="w-60 bg-secondary border-l border-border">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">
          Участники — {members.length}
        </h3>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {member.username[0].toUpperCase()}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-secondary ${
                      member.status === "online" ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>
                <span className="text-sm text-foreground">{member.username}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MemberList;
