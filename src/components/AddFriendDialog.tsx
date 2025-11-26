import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFriendAdded: () => void;
}

const AddFriendDialog = ({ open, onOpenChange, onFriendAdded }: AddFriendDialogProps) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!username.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо авторизоваться",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Find user by username
    const { data: profiles, error: searchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (searchError || !profiles) {
      toast({
        title: "Ошибка",
        description: "Пользователь не найден",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (profiles.id === user.id) {
      toast({
        title: "Ошибка",
        description: "Нельзя добавить себя в друзья",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create friendship request
    const { error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: profiles.id,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Ошибка",
          description: "Заявка уже отправлена",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить заявку",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Успех",
        description: "Заявка в друзья отправлена!",
      });
      setUsername("");
      onOpenChange(false);
      onFriendAdded();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Добавить друга</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleAdd}
            disabled={loading || !username.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Отправить заявку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendDialog;
