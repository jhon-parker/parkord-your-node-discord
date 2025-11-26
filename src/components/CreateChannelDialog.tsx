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

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  onChannelCreated: () => void;
}

const CreateChannelDialog = ({
  open,
  onOpenChange,
  serverId,
  onChannelCreated,
}: CreateChannelDialogProps) => {
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!channelName.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("channels").insert({
      name: channelName,
      server_id: serverId,
      type: "text",
    });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать канал",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успех",
        description: "Канал создан!",
      });
      setChannelName("");
      onOpenChange(false);
      onChannelCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Создать канал</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название канала</Label>
            <Input
              id="name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="общий"
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={loading || !channelName.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelDialog;
