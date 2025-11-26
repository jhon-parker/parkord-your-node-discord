import { Plus, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Server {
  id: string;
  name: string;
  icon?: string;
}

interface ServerListProps {
  servers: Server[];
  selectedServer: string | null;
  onSelectServer: (serverId: string) => void;
  onCreateServer: () => void;
}

const ServerList = ({ servers, selectedServer, onSelectServer, onCreateServer }: ServerListProps) => {
  return (
    <div className="w-20 bg-background border-r border-border flex flex-col items-center py-4 space-y-2">
      <ScrollArea className="flex-1 w-full">
        <div className="space-y-2 px-3">
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => onSelectServer(server.id)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                selectedServer === server.id
                  ? "bg-primary text-primary-foreground shadow-glow rounded-xl"
                  : "bg-secondary hover:bg-secondary/80 hover:rounded-xl"
              }`}
            >
              {server.icon || <Hash className="w-6 h-6" />}
            </button>
          ))}
        </div>
      </ScrollArea>
      
      <Button
        onClick={onCreateServer}
        size="icon"
        className="w-14 h-14 rounded-2xl bg-secondary hover:bg-primary hover:text-primary-foreground hover:rounded-xl hover:shadow-glow transition-all"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default ServerList;
