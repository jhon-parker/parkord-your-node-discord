import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import MediaUpload from "@/components/MediaUpload";
import UserStatusIndicator from "@/components/UserStatusIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  media_url?: string;
  sender?: {
    username: string;
    status?: string;
  };
}

interface DirectMessagesProps {
  friendId: string;
  friendName: string;
}

const DirectMessages = ({ friendId, friendName }: DirectMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [friendStatus, setFriendStatus] = useState<string>("offline");
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
      fetchFriendStatus();
      subscribeToMessages();
    }
  }, [friendId, currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchFriendStatus = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", friendId)
      .maybeSingle();
    if (data) setFriendStatus(data.status || "offline");
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*, sender:profiles!direct_messages_sender_id_fkey(username)")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сообщения",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
      markAsRead();
    }
  };

  const markAsRead = async () => {
    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("receiver_id", currentUserId)
      .eq("sender_id", friendId)
      .eq("read", false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`dm:${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === friendId) ||
            (newMsg.sender_id === friendId && newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.sender_id === friendId) {
              markAsRead();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaUrl) return;

    setLoading(true);
    const { error } = await supabase.from("direct_messages").insert({
      content: newMessage || (mediaUrl ? "📎 Медиафайл" : ""),
      sender_id: currentUserId,
      receiver_id: friendId,
      media_url: mediaUrl,
    });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      setMediaUrl(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="h-16 border-b border-border flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {friendName[0].toUpperCase()}
            </div>
            <UserStatusIndicator
              status={friendStatus}
              className="absolute -bottom-0.5 -right-0.5 border-2 border-background"
            />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{friendName}</h3>
            <span className="text-xs text-muted-foreground">
              {friendStatus === "online" ? "В сети" : friendStatus === "idle" ? "Не активен" : friendStatus === "dnd" ? "Не беспокоить" : "Не в сети"}
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isSent = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isSent ? "flex-row-reverse" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {isSent ? "Я" : friendName[0].toUpperCase()}
                </div>
                <div className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-foreground">
                      {isSent ? "Вы" : friendName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`mt-1 px-4 py-2 rounded-lg max-w-md ${
                      isSent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {message.content}
                    {message.media_url && (
                      <img
                        src={message.media_url}
                        alt="Media"
                        className="mt-2 max-w-full rounded cursor-pointer hover:opacity-90"
                        onClick={() => window.open(message.media_url, "_blank")}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4">
        {mediaUrl && (
          <div className="mb-2 p-2 bg-secondary rounded-lg border border-border">
            <img src={mediaUrl} alt="Preview" className="max-h-32 rounded" />
          </div>
        )}
        <div className="flex gap-2">
          <MediaUpload onUpload={setMediaUrl} disabled={loading} />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Сообщение для ${friendName}`}
            className="bg-secondary border-border"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-primary hover:bg-primary/90 shadow-glow"
            disabled={loading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DirectMessages;
