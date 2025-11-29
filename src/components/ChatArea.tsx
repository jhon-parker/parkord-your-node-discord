import { useState, useEffect, useRef } from "react";
import { Hash, Send, Pin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import MediaUpload from "@/components/MediaUpload";
import MediaPreview from "@/components/MediaPreview";
import MessageActions from "@/components/MessageActions";
import PinnedMessages from "@/components/PinnedMessages";
import UserProfileCard from "@/components/UserProfileCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  media_url?: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface ChatAreaProps {
  channelId: string;
  channelName: string;
  members?: { id: string; username: string }[];
  isOwner?: boolean;
  showMemberList?: boolean;
  onToggleMemberList?: () => void;
}

const ChatArea = ({ channelId, channelName, members = [], isOwner = false, showMemberList, onToggleMemberList }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { toast } = useToast();
  const { playNotification } = useNotificationSound();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchMessages();
    const unsub = subscribeToMessages();
    return unsub;
  }, [channelId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles(username, avatar_url)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить сообщения", variant: "destructive" });
    } else {
      setMessages(data || []);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newMsg = payload.new as Message;
          if (newMsg.user_id !== currentUserId) {
            playNotification();
          }
        }
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaUrl) return;

    setLoading(true);
    if (!currentUserId) {
      toast({ title: "Ошибка", description: "Необходимо авторизоваться", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      content: newMessage.trim(),
      channel_id: channelId,
      user_id: currentUserId,
      media_url: mediaUrl,
    });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось отправить сообщение", variant: "destructive" });
    } else {
      setNewMessage("");
      setMediaUrl(null);
    }
    setLoading(false);
  };

  const handlePinMessage = async (messageId: string) => {
    const { error } = await supabase.from("pinned_messages").insert({
      message_id: messageId,
      channel_id: channelId,
      pinned_by: currentUserId,
    });

    if (!error) {
      toast({ title: "Сообщение закреплено" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || value[lastAtIndex - 1] === " ")) {
      const filter = value.slice(lastAtIndex + 1).toLowerCase();
      setMentionFilter(filter);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (username: string) => {
    const lastAtIndex = newMessage.lastIndexOf("@");
    const newText = newMessage.slice(0, lastAtIndex) + `@${username} `;
    setNewMessage(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredMembers = members.filter((m) => m.username.toLowerCase().includes(mentionFilter));

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const username = part.slice(1);
        const member = members.find((m) => m.username.toLowerCase() === username.toLowerCase());
        return (
          <span
            key={i}
            className={`${member ? "bg-primary/20 text-primary cursor-pointer hover:underline" : ""} rounded px-0.5`}
            onClick={() => member && setSelectedProfileId(member.id)}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isMediaFile = (url: string) => url?.match(/\.(jpg|jpeg|png|gif|webp|bmp|mp4|webm|ogg|mov)(\?|$)/i);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center">
          <Hash className="w-6 h-6 text-muted-foreground mr-2" />
          <h3 className="font-bold text-foreground">{channelName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <PinnedMessages channelId={channelId} isOwner={isOwner} messages={messages} />
          {onToggleMemberList && (
            <Button variant="ghost" size="icon" onClick={onToggleMemberList} className={showMemberList ? "bg-muted" : ""}>
              <Users className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center py-8 mb-4 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Hash className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">#{channelName}</h2>
          <p className="text-muted-foreground text-sm mt-1">Это начало канала #{channelName}</p>
        </div>

        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.user_id === currentUserId;
            return (
              <div key={message.id} className="flex gap-3 group">
                <div className="cursor-pointer" onClick={() => setSelectedProfileId(message.user_id)}>
                  {message.profiles?.avatar_url ? (
                    <img src={message.profiles.avatar_url} alt={message.profiles.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {message.profiles?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-foreground cursor-pointer hover:underline" onClick={() => setSelectedProfileId(message.user_id)}>
                      {message.profiles?.username || "Пользователь"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <MessageActions messageId={message.id} content={message.content} isOwn={isOwn} tableName="messages" onUpdate={fetchMessages} />
                    {isOwner && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handlePinMessage(message.id)}>
                        <Pin className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {message.content && <p className="text-foreground mt-1">{renderMessageContent(message.content)}</p>}
                  {message.media_url && isMediaFile(message.media_url) && (
                    message.media_url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? (
                      <video src={message.media_url} controls className="mt-2 max-w-md rounded-lg cursor-pointer hover:opacity-90" onClick={() => setPreviewUrl(message.media_url!)} />
                    ) : (
                      <img src={message.media_url} alt="Media" className="mt-2 max-w-md max-h-80 rounded-lg cursor-pointer hover:opacity-90 object-cover" onClick={() => setPreviewUrl(message.media_url!)} />
                    )
                  )}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 relative">
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
            {filteredMembers.map((member) => (
              <button key={member.id} type="button" className="w-full px-3 py-2 text-left hover:bg-muted text-foreground" onClick={() => handleMentionSelect(member.username)}>
                @{member.username}
              </button>
            ))}
          </div>
        )}
        {mediaUrl && (
          <div className="mb-2 p-2 bg-secondary rounded-lg border border-border relative">
            {mediaUrl.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? (
              <video src={mediaUrl} className="max-h-32 rounded" controls />
            ) : (
              <img src={mediaUrl} alt="Preview" className="max-h-32 rounded" />
            )}
            <Button type="button" size="icon" variant="secondary" className="absolute top-1 right-1 h-6 w-6" onClick={() => setMediaUrl(null)}>×</Button>
          </div>
        )}
        <div className="flex gap-2">
          <MediaUpload onUpload={setMediaUrl} disabled={loading} />
          <Input ref={inputRef} value={newMessage} onChange={handleInputChange} placeholder={`Сообщение в #${channelName}`} className="bg-secondary border-border" disabled={loading} />
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 shadow-glow" disabled={loading}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {previewUrl && <MediaPreview url={previewUrl} open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)} />}
      {selectedProfileId && <UserProfileCard userId={selectedProfileId} open={!!selectedProfileId} onOpenChange={(open) => !open && setSelectedProfileId(null)} />}
    </div>
  );
};

export default ChatArea;
