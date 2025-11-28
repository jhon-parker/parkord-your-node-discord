import { useState } from "react";
import { Edit2, Trash2, Forward, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageActionsProps {
  messageId: string;
  content: string;
  isOwn: boolean;
  tableName: "messages" | "direct_messages";
  onUpdate: () => void;
}

const MessageActions = ({ messageId, content, isOwn, tableName, onUpdate }: MessageActionsProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    
    const { error } = await supabase
      .from(tableName)
      .update({ content: editContent })
      .eq("id", messageId);

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось изменить", variant: "destructive" });
    } else {
      toast({ title: "Успешно", description: "Сообщение изменено" });
      setEditOpen(false);
      onUpdate();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", messageId);

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось удалить", variant: "destructive" });
    } else {
      toast({ title: "Успешно", description: "Сообщение удалено" });
      onUpdate();
    }
  };

  const handleForward = () => {
    navigator.clipboard.writeText(content);
    toast({ title: "Скопировано", description: "Сообщение скопировано в буфер" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover border-border">
          {isOwn && (
            <DropdownMenuItem onClick={() => {
              setEditContent(content);
              setEditOpen(true);
            }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Редактировать
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleForward}>
            <Forward className="w-4 h-4 mr-2" />
            Переслать
          </DropdownMenuItem>
          {isOwn && (
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Редактировать сообщение</DialogTitle>
          </DialogHeader>
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="bg-secondary border-border"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Отмена</Button>
            <Button onClick={handleEdit} disabled={loading}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageActions;
