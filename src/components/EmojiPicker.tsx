import { useState } from "react";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const EMOJI_LIST = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎",
  "❤️", "🔥", "⭐", "🎉", "💯", "🙏", "👏", "🤣", "😭", "😱",
  "🥺", "😤", "🤝", "💪", "🫡", "🤡", "💀", "👀", "🗿", "✅",
  "❌", "⚡", "🌟", "💎", "🏆", "🎯", "🚀", "💬", "📌", "🔔",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker = ({ onSelect }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-popover border-border" side="top">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
