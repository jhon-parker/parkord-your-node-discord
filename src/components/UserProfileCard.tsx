import { useState, useEffect } from "react";
import { UserPlus, MessageCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserStatusIndicator from "./UserStatusIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfileCardProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartDM?: (userId: string, username: string) => void;
}

const UserProfileCard = ({ userId, open, onOpenChange, onStartDM }: UserProfileCardProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
      checkFriendship();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    setProfile(data);
  };

  const checkFriendship = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("friendships")
      .select("status")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
      .maybeSingle();

    setFriendshipStatus(data?.status || null);
  };

  const handleAddFriend = async () => {
    setLoading(true);
    const { error } = await supabase.from("friendships").insert({
      user_id: currentUserId,
      friend_id: userId,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Заявка уже отправлена", variant: "destructive" });
      } else {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Успешно", description: "Заявка отправлена!" });
      setFriendshipStatus("pending");
    }
    setLoading(false);
  };

  if (!profile) return null;

  const isOwnProfile = currentUserId === userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Профиль пользователя</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
                {profile.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <UserStatusIndicator
              status={profile.status || "offline"}
              className="absolute bottom-1 right-1 w-5 h-5 border-4 border-card"
            />
          </div>

          <h3 className="text-xl font-bold text-foreground">{profile.username}</h3>
          
          <span className="text-sm text-muted-foreground">
            {profile.status === "online" ? "В сети" : 
             profile.status === "idle" ? "Не активен" :
             profile.status === "dnd" ? "Не беспокоить" : "Не в сети"}
          </span>

          {profile.bio && (
            <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>
          )}

          {!isOwnProfile && (
            <div className="flex gap-2 mt-6 w-full">
              {friendshipStatus === "accepted" ? (
                <Button
                  className="flex-1"
                  onClick={() => {
                    onOpenChange(false);
                    onStartDM?.(userId, profile.username);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Написать
                </Button>
              ) : friendshipStatus === "pending" ? (
                <Button className="flex-1" disabled variant="secondary">
                  Заявка отправлена
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handleAddFriend}
                  disabled={loading}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Добавить в друзья
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileCard;
