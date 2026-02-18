import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Reaction {
  emoji: string;
  count: number;
  users: { id: string; username: string }[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  tableName: "messages" | "direct_messages";
  currentUserId: string;
}

const MessageReactions = ({ messageId, tableName, currentUserId }: MessageReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    fetchReactions();
    const channel = supabase
      .channel(`reactions:${messageId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions", filter: `message_id=eq.${messageId}` }, () => {
        fetchReactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [messageId]);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("message_reactions")
      .select("emoji, user_id")
      .eq("message_id", messageId)
      .eq("table_name", tableName);

    if (!data) return;

    // Collect unique user_ids and fetch their profiles
    const userIds = [...new Set(data.map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    const profileMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p.username; });

    const grouped: Record<string, { users: { id: string; username: string }[] }> = {};
    data.forEach((r: any) => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { users: [] };
      grouped[r.emoji].users.push({ id: r.user_id, username: profileMap[r.user_id] || "User" });
    });

    setReactions(
      Object.entries(grouped).map(([emoji, { users }]) => ({
        emoji,
        count: users.length,
        users,
        hasReacted: users.some((u) => u.id === currentUserId),
      }))
    );
  };

  const toggleReaction = async (emoji: string) => {
    const existing = reactions.find((r) => r.emoji === emoji);
    if (existing?.hasReacted) {
      await supabase.from("message_reactions").delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji)
        .eq("table_name", tableName);
    } else {
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: currentUserId,
        emoji,
        table_name: tableName,
      });
    }
  };

  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <Popover key={reaction.emoji}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); toggleReaction(reaction.emoji); }}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                reaction.hasReacted
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 bg-popover border-border" side="top">
            <p className="text-xs font-semibold mb-1">{reaction.emoji} — {reaction.count}</p>
            <div className="space-y-0.5">
              {reaction.users.map((u) => (
                <p key={u.id} className="text-xs text-muted-foreground">{u.username}</p>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
};

export default MessageReactions;
