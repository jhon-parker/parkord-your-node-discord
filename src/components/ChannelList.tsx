import { Hash, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
}

interface ChannelListProps {
  serverName: string;
  channels: Channel[];
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
}

const ChannelList = ({
  serverName,
  channels,
  selectedChannel,
  onSelectChannel,
  onCreateChannel,
}: ChannelListProps) => {
  return (
    <div className="w-60 bg-secondary border-r border-border flex flex-col">
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        <h2 className="font-bold text-foreground">{serverName}</h2>
        <Button size="icon" variant="ghost">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Текстовые каналы
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4"
              onClick={onCreateChannel}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors ${
                selectedChannel === channel.id ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              <Hash className="w-5 h-5" />
              <span className="text-sm">{channel.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChannelList;
