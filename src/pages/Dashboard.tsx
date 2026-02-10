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
import ServerSettings from "@/components/ServerSettings";
import UserSettings from "@/components/UserSettings";
import { supabase } from "@/integrations/supabase/client";
import { useUserStatus } from "@/hooks/useUserStatus";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "servers" | "friends";

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
  const [showMemberList, setShowMemberList] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useUserStatus(user?.id || null);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUser(session.user);
    fetchServers();
  };

  const fetchServers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: memberData } = await supabase.from("server_members").select("server_id").eq("user_id", user.id);
    if (!memberData) return;
    const serverIds = memberData.map((m) => m.server_id);
    if (serverIds.length === 0) { setServers([]); return; }
    const { data } = await supabase.from("servers").select("*").in("id", serverIds).order("created_at", { ascending: true });
    setServers(data || []);
    if (data && data.length > 0 && !selectedServer) setSelectedServer(data[0].id);
  };

  const fetchChannels = async (serverId: string) => {
    const { data } = await supabase.from("channels").select("*").eq("server_id", serverId).order("position", { ascending: true });
    setChannels(data || []);
    if (data && data.length > 0 && !selectedChannel) setSelectedChannel(data[0].id);
  };

  const fetchMembers = async (serverId: string) => {
    const { data } = await supabase
      .from("server_members")
      .select("user_id, profiles(username, status, avatar_url)")
      .eq("server_id", serverId)
      .limit(50);
    setMembers(
      (data || []).map((member: any) => ({
        id: member.user_id,
        username: member.profiles?.username || "Пользователь",
        status: member.profiles?.status || "offline",
        avatar_url: member.profiles?.avatar_url,
      }))
    );
  };

  const handleServerDeleted = () => {
    setSelectedServer(null);
    setSelectedChannel(null);
    fetchServers();
  };

  const handleLeaveServer = async (serverId: string) => {
    if (!user) return;
    const { error } = await supabase.from("server_members").delete().eq("server_id", serverId).eq("user_id", user.id);
    if (!error) {
      toast({ title: "Вы покинули сервер" });
      if (selectedServer === serverId) { setSelectedServer(null); setSelectedChannel(null); }
      fetchServers();
    }
  };

  const handleKickUser = async (userId: string) => {
    if (!selectedServer) return;
    const { error } = await supabase.from("server_members").delete().eq("server_id", selectedServer).eq("user_id", userId);
    if (!error) { toast({ title: "Пользователь исключён" }); fetchMembers(selectedServer); }
  };

  const handleBanUser = async (userId: string) => {
    if (!selectedServer || !user) return;
    await supabase.from("server_members").delete().eq("server_id", selectedServer).eq("user_id", userId);
    await supabase.from("server_bans").insert({ server_id: selectedServer, user_id: userId, banned_by: user.id });
    toast({ title: "Пользователь забанен" });
    fetchMembers(selectedServer);
  };

  const handleSetRole = async (userId: string, role: string) => {
    if (!selectedServer) return;
    const { error } = await supabase.from("server_member_roles").upsert(
      { server_id: selectedServer, user_id: userId, role: role as any },
      { onConflict: "server_id,user_id" }
    );
    if (!error) toast({ title: `Роль назначена: ${role}` });
  };

  // Realtime: sync members, channels, servers
  useEffect(() => {
    if (selectedServer && viewMode === "servers") {
      fetchChannels(selectedServer);
      fetchMembers(selectedServer);

      const memberChannel = supabase
        .channel(`server-members-rt:${selectedServer}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "server_members", filter: `server_id=eq.${selectedServer}` }, () => {
          fetchMembers(selectedServer);
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
          fetchMembers(selectedServer);
        })
        .subscribe();

      const channelSub = supabase
        .channel(`channels-rt:${selectedServer}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "channels", filter: `server_id=eq.${selectedServer}` }, (payload) => {
          fetchChannels(selectedServer);
          if (payload.eventType === "DELETE" && payload.old && (payload.old as any).id === selectedChannel) {
            setSelectedChannel(null);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(memberChannel);
        supabase.removeChannel(channelSub);
      };
    }
  }, [selectedServer, viewMode]);

  // Realtime: sync server list (join/leave/delete)
  useEffect(() => {
    if (!user) return;
    const serverSub = supabase
      .channel("servers-rt-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "servers" }, (payload) => {
        if (payload.eventType === "DELETE" && (payload.old as any)?.id === selectedServer) {
          setSelectedServer(null);
          setSelectedChannel(null);
          toast({ title: "Сервер был удалён" });
        }
        fetchServers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "server_members" }, () => {
        fetchServers();
      })
      .subscribe();

    return () => { supabase.removeChannel(serverSub); };
  }, [user, selectedServer]);

  const handleSelectServer = (serverId: string) => {
    setSelectedServer(serverId);
    setSelectedChannel(null);
    setSelectedDM(null);
    setViewMode("servers");
  };

  const handleStartDM = (friendId: string, friendName: string) => {
    setSelectedDM({ id: friendId, name: friendName });
    setViewMode("friends");
  };

  const currentServer = servers.find((s) => s.id === selectedServer);
  const currentChannel = channels.find((c) => c.id === selectedChannel);
  const isServerOwner = currentServer?.owner_id === user?.id;

  if (!user) return null;

  return (
    <div className="h-screen flex">
      <div className="w-20 bg-background border-r border-border flex flex-col items-center py-4 space-y-2">
        <button
          onClick={() => { setViewMode("friends"); setSelectedDM(null); }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            viewMode === "friends" ? "bg-primary text-primary-foreground shadow-glow rounded-xl" : "bg-secondary hover:bg-secondary/80 hover:rounded-xl"
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
          onLeaveServer={handleLeaveServer}
        />

        <div className="mt-auto pt-2 border-t border-border">
          <UserSettings user={user} onProfileUpdate={() => { if (selectedServer) fetchMembers(selectedServer); }} />
        </div>
      </div>

      {viewMode === "friends" && (
        <>
          <DMList selectedDM={selectedDM?.id || null} onSelectDM={handleStartDM} />
          {selectedDM ? <DirectMessages friendId={selectedDM.id} friendName={selectedDM.name} /> : <FriendsList onStartDM={handleStartDM} />}
        </>
      )}

      {viewMode === "servers" && selectedServer && (
        <>
          <div className="w-60 bg-secondary border-r border-border flex flex-col">
            <div className="h-16 border-b border-border flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                {currentServer?.icon ? (
                  <img src={currentServer.icon} alt={currentServer.name} className="w-8 h-8 rounded-full object-cover" />
                ) : null}
                <h2 className="font-bold text-foreground truncate">{currentServer?.name || "Сервер"}</h2>
              </div>
              {isServerOwner && (
                <ServerSettings
                  server={currentServer}
                  channels={channels}
                  members={members}
                  isOwner={isServerOwner}
                  onUpdate={() => {
                    fetchServers();
                    if (selectedServer) { fetchChannels(selectedServer); fetchMembers(selectedServer); }
                  }}
                  onDelete={handleServerDeleted}
                />
              )}
            </div>
            <ChannelList
              serverName={currentServer?.name || "Сервер"}
              serverId={selectedServer}
              channels={channels}
              selectedChannel={selectedChannel}
              onSelectChannel={setSelectedChannel}
              onCreateChannel={() => setShowChannelDialog(true)}
              showHeader={false}
              isOwner={isServerOwner}
              onUpdate={() => fetchChannels(selectedServer)}
            />
          </div>

          {selectedChannel && (
            <>
              <ChatArea
                channelId={selectedChannel}
                channelName={currentChannel?.name || "канал"}
                members={members}
                isOwner={isServerOwner}
                showMemberList={showMemberList}
                onToggleMemberList={() => setShowMemberList(!showMemberList)}
              />
              {showMemberList && (
                <MemberList
                  members={members}
                  onStartDM={handleStartDM}
                  isOwner={isServerOwner}
                  onKick={handleKickUser}
                  onBan={handleBanUser}
                  onSetRole={handleSetRole}
                  ownerId={currentServer?.owner_id}
                />
              )}
            </>
          )}
        </>
      )}

      <CreateServerDialog open={showServerDialog} onOpenChange={setShowServerDialog} onServerCreated={fetchServers} />
      {selectedServer && (
        <CreateChannelDialog open={showChannelDialog} onOpenChange={setShowChannelDialog} serverId={selectedServer} onChannelCreated={() => fetchChannels(selectedServer)} />
      )}
      <ServerSearch open={showServerSearch} onOpenChange={setShowServerSearch} onServerJoined={fetchServers} />
    </div>
  );
};

export default Dashboard;
