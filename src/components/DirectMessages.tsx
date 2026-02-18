import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import MediaUpload from "@/components/MediaUpload";
import MediaPreview from "@/components/MediaPreview";
import MessageActions from "@/components/MessageActions";
import UserStatusIndicator from "@/components/UserStatusIndicator";
import UserProfileCard from "@/components/UserProfileCard";
import EmojiPicker from "@/components/EmojiPicker";
import MessageReactions from "@/components/MessageReactions";
import VoiceRecorder from "@/components/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  media_url?: string;
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
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<string>("offline");
  const [friendAvatar, setFriendAvatar] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
      fetchFriendProfile();
      const unsub = subscribeToMessages();
      const unsubProfile = subscribeToFriendStatus();
      return () => {
        unsub();
        unsubProfile();
      };
    }
  }, [friendId, currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      if (data) setCurrentUserAvatar(data.avatar_url);
    }
  };

  const fetchFriendProfile = async () => {
    const { data } = await supabase.from("profiles").select("status, avatar_url").eq("id", friendId).maybeSingle();
    if (data) {
      setFriendStatus(data.status || "offline");
      setFriendAvatar(data.avatar_url);
    }
  };

  const subscribeToFriendStatus = () => {
    const channel = supabase
      .channel(`profile:${friendId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${friendId}` }, (payload) => {
        const u = payload.new as any;
        setFriendStatus(u.status || "offline");
        setFriendAvatar(u.avatar_url);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    markAsRead();
  };

  const markAsRead = async () => {
    await supabase.from("direct_messages").update({ read: true }).eq("receiver_id", currentUserId).eq("sender_id", friendId).eq("read", false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`dm:${friendId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, (payload) => {
        const msg = payload.new as Message;
        if ((msg?.sender_id === currentUserId && msg?.receiver_id === friendId) || (msg?.sender_id === friendId && msg?.receiver_id === currentUserId)) {
          fetchMessages();
        }
        if (payload.eventType === "DELETE") fetchMessages();
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
    const { error } = await supabase.from("direct_messages").insert({
      content: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: friendId,
      media_url: mediaUrl,
    });

    if (!error) {
      setNewMessage("");
      setMediaUrl(null);
    }
    setLoading(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    await supabase.from("direct_messages").delete().eq("id", messageId);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Скопировано" });
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    const existing = await supabase.from("message_reactions").select("id").eq("message_id", messageId).eq("user_id", currentUserId).eq("emoji", emoji).eq("table_name", "direct_messages").maybeSingle();
    if (existing.data) {
      await supabase.from("message_reactions").delete().eq("id", existing.data.id);
    } else {
      await supabase.from("message_reactions").insert({ message_id: messageId, user_id: currentUserId, emoji, table_name: "direct_messages" });
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isMediaFile = (url: string) => url?.match(/\.(jpg|jpeg|png|gif|webp|bmp|mp4|webm|ogg|mov)(\?|$)/i);
  const isAudioFile = (url: string) => url?.match(/\.(webm|mp3|wav|ogg)(\?|$)/i) && !url?.match(/\.(mp4)(\?|$)/i);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="h-16 border-b border-border flex items-center px-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setSelectedProfileId(friendId)}
        >
          <div className="relative">
            {friendAvatar ? (
              <img src={friendAvatar} alt={friendName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {friendName[0].toUpperCase()}
              </div>
            )}
            <UserStatusIndicator status={friendStatus} className="absolute -bottom-0.5 -right-0.5 border-2 border-background" />
          </div>
          <div>
            <h3 className="font-bold text-foreground hover:underline">{friendName}</h3>
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
              <ContextMenu key={message.id}>
                <ContextMenuTrigger>
                  <div className={`flex gap-3 group ${isSent ? "flex-row-reverse" : ""}`}>
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedProfileId(isSent ? currentUserId : friendId)}
                    >
                      {isSent ? (
                        currentUserAvatar ? (
                          <img src={currentUserAvatar} alt="Вы" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">Я</div>
                        )
                      ) : friendAvatar ? (
                        <img src={friendAvatar} alt={friendName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">{friendName[0].toUpperCase()}</div>
                      )}
                    </div>
                    <div className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold text-foreground cursor-pointer hover:underline"
                          onClick={() => setSelectedProfileId(isSent ? currentUserId : friendId)}
                        >
                          {isSent ? "Вы" : friendName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <EmojiPicker onSelect={(emoji) => handleAddReaction(message.id, emoji)} />
                        <MessageActions messageId={message.id} content={message.content} isOwn={isSent} tableName="direct_messages" onUpdate={fetchMessages} />
                      </div>
                      <div className={`mt-1 px-4 py-2 rounded-lg max-w-md ${isSent ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        {message.content && <p>{message.content}</p>}
                        {message.media_url && isAudioFile(message.media_url) && (
                          <audio src={message.media_url} controls className="mt-2 max-w-full" />
                        )}
                        {message.media_url && isMediaFile(message.media_url) && !isAudioFile(message.media_url) && (
                          message.media_url.match(/\.(mp4|mov)(\?|$)/i) ? (
                            <video src={message.media_url} controls className="mt-2 max-w-full rounded cursor-pointer" onClick={() => setPreviewUrl(message.media_url!)} />
                          ) : (
                            <img src={message.media_url} alt="Media" className="mt-2 max-w-full max-h-60 rounded cursor-pointer hover:opacity-90" onClick={() => setPreviewUrl(message.media_url!)} />
                          )
                        )}
                      </div>
                      <MessageReactions messageId={message.id} tableName="direct_messages" currentUserId={currentUserId} />
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="bg-popover border-border">
                  <ContextMenuItem onClick={() => handleAddReaction(message.id, "👍")}>👍 Нравится</ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAddReaction(message.id, "❤️")}>❤️ Любовь</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleCopyMessage(message.content)}>Копировать текст</ContextMenuItem>
                  {isSent && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleDeleteMessage(message.id)} className="text-destructive">Удалить</ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4">
        {mediaUrl && (
          <div className="mb-2 p-2 bg-secondary rounded-lg border border-border relative">
            {mediaUrl.match(/\.(webm|mp3|wav|ogg)(\?|$)/i) ? (
              <audio src={mediaUrl} controls className="w-full" />
            ) : mediaUrl.match(/\.(mp4|mov)(\?|$)/i) ? (
              <video src={mediaUrl} className="max-h-32 rounded" controls />
            ) : (
              <img src={mediaUrl} alt="Preview" className="max-h-32 rounded" />
            )}
            <Button type="button" size="icon" variant="secondary" className="absolute top-1 right-1 h-6 w-6" onClick={() => setMediaUrl(null)}>×</Button>
          </div>
        )}
        <div className="flex gap-2">
          <MediaUpload onUpload={setMediaUrl} disabled={loading} />
          <VoiceRecorder onRecorded={setMediaUrl} disabled={loading} />
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Сообщение для ${friendName}`} className="bg-secondary border-border" disabled={loading} />
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 shadow-glow" disabled={loading}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {previewUrl && <MediaPreview url={previewUrl} open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)} />}
      {selectedProfileId && (
        <UserProfileCard userId={selectedProfileId} open={!!selectedProfileId} onOpenChange={(open) => !open && setSelectedProfileId(null)} />
      )}
    </div>
  );
};

export default DirectMessages;
