import { useState } from "react";
import { Search, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Server {
  id: string;
  name: string;
  owner_id: string;
  member_count?: number;
}

interface ServerSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerJoined: () => void;
}

const ServerSearch = ({ open, onOpenChange, onServerJoined }: ServerSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const { data, error } = await supabase
        .from("servers")
        .select("*")
        .limit(20);

      if (!error) setServers(data || []);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("servers")
      .select("*")
      .ilike("name", `%${searchQuery}%`)
      .limit(20);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось найти серверы",
        variant: "destructive",
      });
    } else {
      setServers(data || []);
    }
    setLoading(false);
  };

  const handleJoinServer = async (serverId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("server_members").insert({
      server_id: serverId,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Уже участник",
          description: "Вы уже состоите на этом сервере",
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось присоединиться",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Успех",
        description: "Вы присоединились к серверу!",
      });
      onServerJoined();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>Поиск серверов</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Название сервера..."
              className="bg-secondary border-border"
            />
            <Button
              onClick={handleSearch}
              className="bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="bg-secondary p-4 rounded-lg flex items-center justify-between hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{server.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Публичный сервер
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleJoinServer(server.id)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Присоединиться
                  </Button>
                </div>
              ))}
              {servers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Нажмите поиск чтобы найти серверы
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServerSearch;
