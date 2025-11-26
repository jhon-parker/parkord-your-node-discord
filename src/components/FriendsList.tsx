import { useState, useEffect } from "react";
import { UserPlus, Check, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddFriendDialog from "./AddFriendDialog";

interface Friend {
  id: string;
  username: string;
  status: string;
  friendship_id: string;
  is_requester: boolean;
}

interface FriendsListProps {
  onStartDM: (friendId: string, friendName: string) => void;
}

const FriendsList = ({ onStartDM }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        status,
        user_id,
        friend_id,
        user:profiles!friendships_user_id_fkey(id, username),
        friend:profiles!friendships_friend_id_fkey(id, username)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error("Error fetching friends:", error);
      return;
    }

    const friendsList = (data || []).map((friendship: any) => {
      const isRequester = friendship.user_id === user.id;
      const friendData = isRequester ? friendship.friend : friendship.user;
      return {
        id: friendData?.id || "",
        username: friendData?.username || "Пользователь",
        status: friendship.status,
        friendship_id: friendship.id,
        is_requester: isRequester,
      };
    });

    setFriends(friendsList);
  };

  const handleAcceptFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось принять запрос",
        variant: "destructive",
      });
    } else {
      toast({ title: "Успех", description: "Заявка принята!" });
      fetchFriends();
    }
  };

  const handleRejectFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить запрос",
        variant: "destructive",
      });
    } else {
      toast({ title: "Успех", description: "Заявка отклонена" });
      fetchFriends();
    }
  };

  const pendingRequests = friends.filter(
    (f) => f.status === "pending" && !f.is_requester
  );
  const acceptedFriends = friends.filter((f) => f.status === "accepted");

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        <h3 className="font-bold text-foreground">Друзья</h3>
        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              Входящие заявки — {pendingRequests.length}
            </h4>
            <div className="space-y-2">
              {pendingRequests.map((friend) => (
                <div
                  key={friend.friendship_id}
                  className="bg-secondary p-3 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {friend.username[0].toUpperCase()}
                    </div>
                    <span className="font-semibold">{friend.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      onClick={() => handleAcceptFriend(friend.friendship_id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleRejectFriend(friend.friendship_id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            Все друзья — {acceptedFriends.length}
          </h4>
          <div className="space-y-2">
            {acceptedFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-secondary p-3 rounded-lg flex items-center justify-between hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {friend.username[0].toUpperCase()}
                  </div>
                  <span className="font-semibold">{friend.username}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onStartDM(friend.id, friend.username)}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <AddFriendDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onFriendAdded={fetchFriends}
      />
    </div>
  );
};

export default FriendsList;
