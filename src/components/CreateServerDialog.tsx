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

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerCreated: () => void;
}

const CreateServerDialog = ({ open, onOpenChange, onServerCreated }: CreateServerDialogProps) => {
  const [serverName, setServerName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!serverName.trim()) return;

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

    const { error } = await supabase.from("servers").insert({ 
      name: serverName,
      owner_id: user.id 
    });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать сервер",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успех",
        description: "Сервер создан!",
      });
      setServerName("");
      onOpenChange(false);
      onServerCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Создать сервер</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название сервера</Label>
            <Input
              id="name"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Мой сервер"
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={loading || !serverName.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateServerDialog;
