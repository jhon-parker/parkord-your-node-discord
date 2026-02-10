import { Plus, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

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
  onLeaveServer?: (serverId: string) => void;
}

const ServerList = ({ servers, selectedServer, onSelectServer, onCreateServer, onLeaveServer }: ServerListProps) => {
  return (
    <>
      <ScrollArea className="flex-1 w-full">
        <div className="space-y-2 px-3">
          {servers.map((server) => (
            <ContextMenu key={server.id}>
              <ContextMenuTrigger>
                <button
                  onClick={() => onSelectServer(server.id)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all overflow-hidden ${
                    selectedServer === server.id
                      ? "bg-primary text-primary-foreground shadow-glow rounded-xl"
                      : "bg-secondary hover:bg-secondary/80 hover:rounded-xl"
                  }`}
                  title={server.name}
                >
                  {server.icon ? (
                    <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{server.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-popover border-border">
                <ContextMenuItem className="text-xs text-muted-foreground" disabled>{server.name}</ContextMenuItem>
                {onLeaveServer && (
                  <ContextMenuItem onClick={() => onLeaveServer(server.id)} className="text-destructive">
                    Покинуть сервер
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
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
    </>
  );
};

export default ServerList;
