import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface DMConversation {
  id: string;
  username: string;
  lastMessage?: string;
  unreadCount: number;
}

interface DMListProps {
  selectedDM: string | null;
  onSelectDM: (friendId: string, friendName: string) => void;
}

const DMList = ({ selectedDM, onSelectDM }: DMListProps) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all accepted friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select(`
        id,
        user_id,
        friend_id,
        user:profiles!friendships_user_id_fkey(id, username),
        friend:profiles!friendships_friend_id_fkey(id, username)
      `)
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (!friendships) return;

    const convos: DMConversation[] = await Promise.all(
      friendships.map(async (friendship: any) => {
        const isRequester = friendship.user_id === user.id;
        const friendData = isRequester ? friendship.friend : friendship.user;

        // Get unread count
        const { count } = await supabase
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", friendData.id)
          .eq("receiver_id", user.id)
          .eq("read", false);

        return {
          id: friendData.id,
          username: friendData.username,
          unreadCount: count || 0,
        };
      })
    );

    setConversations(convos);
  };

  return (
    <div className="w-60 bg-secondary border-r border-border flex flex-col">
      <div className="h-16 border-b border-border flex items-center px-4">
        <h2 className="font-bold text-foreground">Личные сообщения</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => onSelectDM(convo.id, convo.username)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-muted transition-colors ${
                selectedDM === convo.id ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {convo.username[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{convo.username}</span>
                  {convo.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет активных диалогов
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DMList;
