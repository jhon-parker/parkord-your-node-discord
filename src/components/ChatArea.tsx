import { useState, useEffect, useRef } from "react";
import { Hash, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import MediaUpload from "@/components/MediaUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  media_url?: string;
  profiles?: {
    username: string;
  };
}

interface ChatAreaProps {
  channelId: string;
  channelName: string;
}

const ChatArea = ({ channelId, channelName }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
  }, [channelId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles(username)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сообщения",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо авторизоваться",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      content: newMessage || (mediaUrl ? "📎 Медиафайл" : ""),
      channel_id: channelId,
      user_id: user.id,
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
        <Hash className="w-6 h-6 text-muted-foreground mr-2" />
        <h3 className="font-bold text-foreground">{channelName}</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {message.profiles?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-foreground">
                    {message.profiles?.username || "Пользователь"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-foreground mt-1">{message.content}</p>
                {message.media_url && (
                  <img
                    src={message.media_url}
                    alt="Media"
                    className="mt-2 max-w-md rounded-lg cursor-pointer hover:opacity-90"
                    onClick={() => window.open(message.media_url, "_blank")}
                  />
                )}
              </div>
            </div>
          ))}
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
            placeholder={`Сообщение в #${channelName}`}
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

export default ChatArea;
