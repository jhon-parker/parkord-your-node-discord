import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ServerList from "@/components/ServerList";
import ChannelList from "@/components/ChannelList";
import ChatArea from "@/components/ChatArea";
import MemberList from "@/components/MemberList";
import CreateServerDialog from "@/components/CreateServerDialog";
import CreateChannelDialog from "@/components/CreateChannelDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showServerDialog, setShowServerDialog] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchServers();
  };

  const fetchServers = async () => {
    const { data, error } = await supabase
      .from("servers")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить серверы",
        variant: "destructive",
      });
    } else {
      setServers(data || []);
      if (data && data.length > 0 && !selectedServer) {
        setSelectedServer(data[0].id);
      }
    }
  };

  const fetchChannels = async (serverId: string) => {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("server_id", serverId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить каналы",
        variant: "destructive",
      });
    } else {
      setChannels(data || []);
      if (data && data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0].id);
      }
    }
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(20);

    if (error) {
      console.error("Error fetching members:", error);
    } else {
      setMembers(
        (data || []).map((profile) => ({
          id: profile.id,
          username: profile.username || "Пользователь",
          status: "online" as const,
        }))
      );
    }
  };

  useEffect(() => {
    if (selectedServer) {
      fetchChannels(selectedServer);
      fetchMembers();
    }
  }, [selectedServer]);

  const currentServer = servers.find((s) => s.id === selectedServer);
  const currentChannel = channels.find((c) => c.id === selectedChannel);

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex">
      <ServerList
        servers={servers}
        selectedServer={selectedServer}
        onSelectServer={setSelectedServer}
        onCreateServer={() => setShowServerDialog(true)}
      />
      
      {selectedServer && (
        <ChannelList
          serverName={currentServer?.name || "Сервер"}
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
          onCreateChannel={() => setShowChannelDialog(true)}
        />
      )}

      {selectedChannel && (
        <>
          <ChatArea
            channelId={selectedChannel}
            channelName={currentChannel?.name || "канал"}
          />
          <MemberList members={members} />
        </>
      )}

      <CreateServerDialog
        open={showServerDialog}
        onOpenChange={setShowServerDialog}
        onServerCreated={fetchServers}
      />

      {selectedServer && (
        <CreateChannelDialog
          open={showChannelDialog}
          onOpenChange={setShowChannelDialog}
          serverId={selectedServer}
          onChannelCreated={() => fetchChannels(selectedServer)}
        />
      )}
    </div>
  );
};

export default Dashboard;
