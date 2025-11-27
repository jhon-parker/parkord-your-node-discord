import { useState, useEffect } from "react";
import { Settings, LogOut, User, Camera } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface UserSettingsProps {
  user: any;
  onProfileUpdate?: () => void;
}

const UserSettings = ({ user, onProfileUpdate }: UserSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    bio: "",
    status: "online",
    avatar_url: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        username: data.username || "",
        bio: data.bio || "",
        status: data.status || "online",
        avatar_url: data.avatar_url || "",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        bio: profile.bio,
        status: profile.status,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить профиль",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Профиль обновлён",
      });
      onProfileUpdate?.();
      setOpen(false);
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аватар",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);

    if (!updateError) {
      setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast({
        title: "Успешно",
        description: "Аватар обновлён",
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.from("profiles").update({ status: "offline" }).eq("id", user.id);
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Настройки профиля</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label>Имя пользователя</Label>
            <Input
              value={profile.username}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, username: e.target.value }))
              }
              className="bg-secondary border-border"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label>О себе</Label>
            <Textarea
              value={profile.bio}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Расскажите о себе..."
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select
              value={profile.status}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    В сети
                  </div>
                </SelectItem>
                <SelectItem value="idle">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Не активен
                  </div>
                </SelectItem>
                <SelectItem value="dnd">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Не беспокоить
                  </div>
                </SelectItem>
                <SelectItem value="offline">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    Невидимый
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Сохранить
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettings;
