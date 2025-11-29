import { useState, useEffect } from "react";
import { Settings, Trash2, UserX, Ban, Edit2, X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServerSettingsProps {
  server: any;
  channels: any[];
  members: any[];
  isOwner: boolean;
  onUpdate: () => void;
  onDelete: () => void;
}

const ServerSettings = ({ server, channels, members, isOwner, onUpdate, onDelete }: ServerSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverName, setServerName] = useState(server?.name || "");
  const [serverDescription, setServerDescription] = useState(server?.description || "");
  const [isPrivate, setIsPrivate] = useState(server?.is_private || false);
  const [serverIcon, setServerIcon] = useState<string | null>(server?.icon || null);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [channelName, setChannelName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && server) {
      setServerName(server.name);
      setServerDescription(server.description || "");
      setIsPrivate(server.is_private || false);
      setServerIcon(server.icon || null);
      fetchBannedUsers();
    }
  }, [open, server]);

  const fetchBannedUsers = async () => {
    const { data } = await supabase
      .from("server_bans")
      .select("*, profiles:user_id(username)")
      .eq("server_id", server.id);
    setBannedUsers(data || []);
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `server-${server.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file);
    if (uploadError) {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
    setServerIcon(urlData.publicUrl);
  };

  const handleSaveServer = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("servers")
      .update({ name: serverName, description: serverDescription, is_private: isPrivate, icon: serverIcon })
      .eq("id", server.id);

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось сохранить", variant: "destructive" });
    } else {
      toast({ title: "Успешно", description: "Сервер обновлён" });
      onUpdate();
    }
    setLoading(false);
  };

  const handleDeleteServer = async () => {
    setLoading(true);
    const { error } = await supabase.from("servers").delete().eq("id", server.id);
    if (error) {
      toast({ title: "Ошибка", description: "Не удалось удалить сервер", variant: "destructive" });
    } else {
      toast({ title: "Успешно", description: "Сервер удалён" });
      setOpen(false);
      onDelete();
    }
    setLoading(false);
  };

  const handleKickUser = async (userId: string) => {
    const { error } = await supabase.from("server_members").delete().eq("server_id", server.id).eq("user_id", userId);
    if (!error) {
      toast({ title: "Успешно", description: "Пользователь исключён" });
      onUpdate();
    }
  };

  const handleBanUser = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("server_members").delete().eq("server_id", server.id).eq("user_id", userId);
    const { error } = await supabase.from("server_bans").insert({ server_id: server.id, user_id: userId, banned_by: user.id });

    if (!error) {
      toast({ title: "Успешно", description: "Пользователь забанен" });
      fetchBannedUsers();
      onUpdate();
    }
  };

  const handleUnbanUser = async (banId: string) => {
    const { error } = await supabase.from("server_bans").delete().eq("id", banId);
    if (!error) {
      toast({ title: "Успешно", description: "Бан снят" });
      fetchBannedUsers();
    }
  };

  const handleUpdateChannel = async (channelId: string) => {
    if (!channelName.trim()) return;
    const { error } = await supabase.from("channels").update({ name: channelName }).eq("id", channelId);
    if (!error) {
      toast({ title: "Успешно", description: "Канал обновлён" });
      setEditingChannel(null);
      onUpdate();
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    const { error } = await supabase.from("channels").delete().eq("id", channelId);
    if (!error) {
      toast({ title: "Успешно", description: "Канал удалён" });
      onUpdate();
    }
  };

  if (!isOwner) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Настройки сервера</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="general" className="flex-1">Общие</TabsTrigger>
            <TabsTrigger value="channels" className="flex-1">Каналы</TabsTrigger>
            <TabsTrigger value="members" className="flex-1">Участники</TabsTrigger>
            <TabsTrigger value="bans" className="flex-1">Баны</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {serverIcon ? (
                  <img src={serverIcon} alt="Server" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                    {serverName[0]?.toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90">
                  <Upload className="w-4 h-4 text-primary-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Название сервера</Label>
                <Input value={serverName} onChange={(e) => setServerName(e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                placeholder="Описание сервера..."
                className="bg-secondary border-border resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Приватный сервер</Label>
                <p className="text-sm text-muted-foreground">Только участники смогут видеть сервер</p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>

            <Button onClick={handleSaveServer} disabled={loading} className="w-full">
              Сохранить изменения
            </Button>

            <div className="border-t border-border pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить сервер
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить сервер?</AlertDialogTitle>
                    <AlertDialogDescription>Это действие нельзя отменить. Все каналы и сообщения будут удалены.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteServer}>Удалить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    {editingChannel === channel.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="bg-muted border-border h-8" />
                        <Button size="sm" onClick={() => handleUpdateChannel(channel.id)}>Сохранить</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingChannel(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-foreground"># {channel.name}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingChannel(channel.id); setChannelName(channel.name); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteChannel(channel.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {member.username?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="text-foreground">{member.username}</span>
                      {member.id === server.owner_id && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Владелец</span>
                      )}
                    </div>
                    {member.id !== server.owner_id && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleKickUser(member.id)}>
                          <UserX className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleBanUser(member.id)}>
                          <Ban className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bans" className="mt-4">
            <ScrollArea className="h-64">
              {bannedUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет забаненных пользователей</p>
              ) : (
                <div className="space-y-2">
                  {bannedUsers.map((ban) => (
                    <div key={ban.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span className="text-foreground">{ban.profiles?.username || "Пользователь"}</span>
                      <Button size="sm" variant="outline" onClick={() => handleUnbanUser(ban.id)}>Разбанить</Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ServerSettings;
