import { useState, useEffect } from "react";
import { Hash, Plus, ChevronDown, ChevronRight, GripVertical, Edit2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import CreateCategoryDialog from "@/components/CreateCategoryDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  type: string;
  category_id?: string | null;
  position: number;
}

interface Category {
  id: string;
  name: string;
  position: number;
}

interface ChannelListProps {
  serverName: string;
  serverId?: string;
  channels: Channel[];
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
  showHeader?: boolean;
  isOwner?: boolean;
  onUpdate?: () => void;
}

const ChannelList = ({
  serverName, serverId, channels, selectedChannel, onSelectChannel, onCreateChannel, showHeader = true, isOwner = false, onUpdate,
}: ChannelListProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ type: "channel" | "category"; id: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const { toast } = useToast();

  useEffect(() => { if (serverId) fetchCategories(); }, [serverId]);

  const fetchCategories = async () => {
    if (!serverId) return;
    const { data } = await supabase.from("channel_categories").select("*").eq("server_id", serverId).order("position", { ascending: true });
    setCategories(data || []);
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleDragStart = (type: "channel" | "category", id: string) => {
    if (!isOwner) return;
    setDraggedItem({ type, id });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDropOnCategory = async (targetCategoryId: string | null) => {
    if (!draggedItem || !isOwner) return;
    if (draggedItem.type === "channel") {
      await supabase.from("channels").update({ category_id: targetCategoryId }).eq("id", draggedItem.id);
      onUpdate?.();
    }
    setDraggedItem(null);
  };

  const handleDropReorder = async (targetId: string, targetType: "channel" | "category") => {
    if (!draggedItem || !isOwner || draggedItem.type !== targetType) return;
    if (targetType === "category") {
      const draggedIdx = categories.findIndex((c) => c.id === draggedItem.id);
      const targetIdx = categories.findIndex((c) => c.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return;
      const newCategories = [...categories];
      const [removed] = newCategories.splice(draggedIdx, 1);
      newCategories.splice(targetIdx, 0, removed);
      for (let i = 0; i < newCategories.length; i++) {
        await supabase.from("channel_categories").update({ position: i }).eq("id", newCategories[i].id);
      }
      fetchCategories();
    } else {
      const draggedIdx = channels.findIndex((c) => c.id === draggedItem.id);
      const targetIdx = channels.findIndex((c) => c.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return;
      const newChannels = [...channels];
      const [removed] = newChannels.splice(draggedIdx, 1);
      newChannels.splice(targetIdx, 0, removed);
      for (let i = 0; i < newChannels.length; i++) {
        await supabase.from("channels").update({ position: i }).eq("id", newChannels[i].id);
      }
      onUpdate?.();
    }
    setDraggedItem(null);
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!categoryName.trim()) return;
    await supabase.from("channel_categories").update({ name: categoryName }).eq("id", categoryId);
    toast({ title: "Категория обновлена" });
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await supabase.from("channels").update({ category_id: null }).eq("category_id", categoryId);
    await supabase.from("channel_categories").delete().eq("id", categoryId);
    toast({ title: "Категория удалена" });
    fetchCategories();
    onUpdate?.();
  };

  const handleDeleteChannel = async (channelId: string) => {
    await supabase.from("channels").delete().eq("id", channelId);
    toast({ title: "Канал удалён" });
    onUpdate?.();
  };

  const uncategorizedChannels = channels.filter((c) => !c.category_id);

  const ChannelItem = ({ channel }: { channel: Channel }) => (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          draggable={isOwner}
          onDragStart={() => handleDragStart("channel", channel.id)}
          onDragOver={handleDragOver}
          onDrop={() => handleDropReorder(channel.id, "channel")}
          onClick={() => onSelectChannel(channel.id)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${
            selectedChannel === channel.id ? "bg-muted text-foreground" : "text-muted-foreground"
          }`}
        >
          {isOwner && <GripVertical className="w-3 h-3 opacity-30" />}
          <Hash className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">{channel.name}</span>
        </div>
      </ContextMenuTrigger>
      {isOwner && (
        <ContextMenuContent className="bg-popover border-border">
          <ContextMenuItem onClick={() => handleDeleteChannel(channel.id)} className="text-destructive">Удалить канал</ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );

  return (
    <div className={showHeader ? "w-60 bg-secondary border-r border-border flex flex-col" : "flex-1 flex flex-col"}>
      {showHeader && (
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          <h2 className="font-bold text-foreground">{serverName}</h2>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* Categories first, then uncategorized */}
          {categories.map((category) => {
            const categoryChannels = channels.filter((c) => c.category_id === category.id);
            const isCollapsed = collapsedCategories.has(category.id);
            return (
              <div
                key={category.id}
                draggable={isOwner}
                onDragStart={() => handleDragStart("category", category.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDropReorder(category.id, "category")}
              >
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div className="flex items-center justify-between px-1 py-1.5 group">
                      <div className="flex items-center gap-1 flex-1 cursor-pointer" onClick={() => toggleCategory(category.id)}>
                        {isOwner && <GripVertical className="w-3 h-3 opacity-30" />}
                        {isCollapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                        {editingCategory === category.id ? (
                          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                            <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="h-5 text-xs bg-muted px-1" autoFocus />
                            <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => handleUpdateCategory(category.id)}>✓</Button>
                            <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => setEditingCategory(null)}><X className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category.name}</span>
                        )}
                      </div>
                      {isOwner && editingCategory !== category.id && (
                        <Button size="icon" variant="ghost" className="h-4 w-4 opacity-0 group-hover:opacity-100" onClick={onCreateChannel}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  {isOwner && (
                    <ContextMenuContent className="bg-popover border-border">
                      <ContextMenuItem onClick={() => { setEditingCategory(category.id); setCategoryName(category.name); }}>Переименовать</ContextMenuItem>
                      <ContextMenuItem onClick={() => handleDeleteCategory(category.id)} className="text-destructive">Удалить категорию</ContextMenuItem>
                    </ContextMenuContent>
                  )}
                </ContextMenu>

                {!isCollapsed && (
                  <div className="ml-2" onDragOver={handleDragOver} onDrop={() => handleDropOnCategory(category.id)}>
                    {categoryChannels.map((channel) => <ChannelItem key={channel.id} channel={channel} />)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized */}
          {uncategorizedChannels.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 py-1.5" onDragOver={handleDragOver} onDrop={() => handleDropOnCategory(null)}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Каналы</span>
                <div className="flex gap-1">
                  {isOwner && serverId && <CreateCategoryDialog serverId={serverId} onCreated={fetchCategories} />}
                  <Button size="icon" variant="ghost" className="h-4 w-4" onClick={onCreateChannel}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {uncategorizedChannels.map((channel) => <ChannelItem key={channel.id} channel={channel} />)}
            </>
          )}

          {uncategorizedChannels.length === 0 && categories.length > 0 && isOwner && serverId && (
            <div className="flex items-center justify-between px-1 py-1.5">
              <div className="flex gap-1 ml-auto">
                <CreateCategoryDialog serverId={serverId} onCreated={fetchCategories} />
                <Button size="icon" variant="ghost" className="h-4 w-4" onClick={onCreateChannel}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChannelList;
