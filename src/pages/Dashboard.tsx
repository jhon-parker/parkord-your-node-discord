import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Compass } from "lucide-react";
import ServerList from "@/components/ServerList";
import ChannelList from "@/components/ChannelList";
import ChatArea from "@/components/ChatArea";
import MemberList from "@/components/MemberList";
import FriendsList from "@/components/FriendsList";
import DirectMessages from "@/components/DirectMessages";
import DMList from "@/components/DMList";
import CreateServerDialog from "@/components/CreateServerDialog";
import CreateChannelDialog from "@/components/CreateChannelDialog";
import ServerSearch from "@/components/ServerSearch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "servers" | "friends" | "dm";

const Dashboard = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("servers");
  const [servers, setServers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedDM, setSelectedDM] = useState<{ id: string; name: string } | null>(null);
  const [showServerDialog, setShowServerDialog] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [showServerSearch, setShowServerSearch] = useState(false);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get servers where user is a member
    const { data: memberData } = await supabase
      .from("server_members")
      .select("server_id")
      .eq("user_id", user.id);

    if (!memberData) return;

    const serverIds = memberData.map((m) => m.server_id);
    
    const { data, error } = await supabase
      .from("servers")
      .select("*")
      .in("id", serverIds)
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

  const fetchMembers = async (serverId: string) => {
    const { data, error } = await supabase
      .from("server_members")
      .select("user_id, profiles(username)")
      .eq("server_id", serverId)
      .limit(50);

    if (error) {
      console.error("Error fetching members:", error);
    } else {
      setMembers(
        (data || []).map((member: any) => ({
          id: member.user_id,
          username: member.profiles?.username || "Пользователь",
          status: "online" as const,
        }))
      );
    }
  };

  useEffect(() => {
    if (selectedServer && viewMode === "servers") {
      fetchChannels(selectedServer);
      fetchMembers(selectedServer);
    }
  }, [selectedServer, viewMode]);

  const handleSelectServer = (serverId: string) => {
    setSelectedServer(serverId);
    setSelectedChannel(null);
    setViewMode("servers");
  };

  const handleStartDM = (friendId: string, friendName: string) => {
    setViewMode("dm");
    setSelectedDM({ id: friendId, name: friendName });
  };

  const currentServer = servers.find((s) => s.id === selectedServer);
  const currentChannel = channels.find((c) => c.id === selectedChannel);

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex">
      {/* Left sidebar - server/mode selection */}
      <div className="w-20 bg-background border-r border-border flex flex-col items-center py-4 space-y-2">
        <button
          onClick={() => setViewMode("friends")}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            viewMode === "friends"
              ? "bg-primary text-primary-foreground shadow-glow rounded-xl"
              : "bg-secondary hover:bg-secondary/80 hover:rounded-xl"
          }`}
        >
          <Users className="w-6 h-6" />
        </button>

        <button
          onClick={() => setShowServerSearch(true)}
          className="w-14 h-14 rounded-2xl bg-secondary hover:bg-primary hover:text-primary-foreground hover:rounded-xl hover:shadow-glow transition-all flex items-center justify-center"
        >
          <Compass className="w-6 h-6" />
        </button>

        <div className="w-full h-px bg-border my-2" />

        <ServerList
          servers={servers}
          selectedServer={selectedServer}
          onSelectServer={handleSelectServer}
          onCreateServer={() => setShowServerDialog(true)}
        />
      </div>

      {/* Middle section - channels/friends/DM list */}
      {viewMode === "servers" && selectedServer && (
        <ChannelList
          serverName={currentServer?.name || "Сервер"}
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
          onCreateChannel={() => setShowChannelDialog(true)}
        />
      )}

      {viewMode === "friends" && (
        <div className="w-60 bg-secondary border-r border-border">
          <div className="h-16 border-b border-border flex items-center px-4">
            <h2 className="font-bold text-foreground">Друзья</h2>
          </div>
        </div>
      )}

      {viewMode === "dm" && (
        <DMList
          selectedDM={selectedDM?.id || null}
          onSelectDM={handleStartDM}
        />
      )}

      {/* Main content area */}
      {viewMode === "servers" && selectedChannel && (
        <>
          <ChatArea
            channelId={selectedChannel}
            channelName={currentChannel?.name || "канал"}
          />
          <MemberList members={members} />
        </>
      )}

      {viewMode === "friends" && (
        <FriendsList onStartDM={handleStartDM} />
      )}

      {viewMode === "dm" && selectedDM && (
        <DirectMessages friendId={selectedDM.id} friendName={selectedDM.name} />
      )}

      {/* Dialogs */}
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

      <ServerSearch
        open={showServerSearch}
        onOpenChange={setShowServerSearch}
        onServerJoined={fetchServers}
      />
    </div>
  );
};

export default Dashboard;
