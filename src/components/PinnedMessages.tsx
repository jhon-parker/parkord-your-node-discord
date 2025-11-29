import { useState, useEffect } from "react";
import { Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PinnedMessage {
  id: string;
  message_id: string;
  pinned_at: string;
  message?: {
    content: string;
    profiles?: { username: string };
  };
}

interface PinnedMessagesProps {
  channelId: string;
  isOwner: boolean;
  messages: any[];
}

const PinnedMessages = ({ channelId, isOwner, messages }: PinnedMessagesProps) => {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPinnedMessages();
  }, [channelId]);

  const fetchPinnedMessages = async () => {
    const { data } = await supabase
      .from("pinned_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("pinned_at", { ascending: false });

    if (data) {
      const enriched = data.map((pm) => {
        const msg = messages.find((m) => m.id === pm.message_id);
        return { ...pm, message: msg };
      });
      setPinnedMessages(enriched);
    }
  };

  const handleUnpin = async (pinId: string) => {
    const { error } = await supabase
      .from("pinned_messages")
      .delete()
      .eq("id", pinId);

    if (!error) {
      toast({ title: "Сообщение откреплено" });
      fetchPinnedMessages();
    }
  };

  if (pinnedMessages.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Pin className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
            {pinnedMessages.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-card border-border" align="end">
        <h4 className="font-semibold text-foreground mb-2">Закреплённые сообщения</h4>
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {pinnedMessages.map((pm) => (
              <div key={pm.id} className="p-2 bg-secondary rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground">
                      {pm.message?.profiles?.username || "Пользователь"}
                    </span>
                    <p className="text-sm text-foreground">{pm.message?.content || "Сообщение удалено"}</p>
                  </div>
                  {isOwner && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUnpin(pm.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default PinnedMessages;
