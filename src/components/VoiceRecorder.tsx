import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecorded: (url: string) => void;
  disabled?: boolean;
}

const VoiceRecorder = ({ onRecorded, disabled }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        await uploadVoice(blob);
      };

      recorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast({ title: "Ошибка", description: "Нет доступа к микрофону", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const uploadVoice = async (blob: Blob) => {
    setUploading(true);
    const fileName = `voice-${Date.now()}.webm`;
    const { error } = await supabase.storage.from("media").upload(fileName, blob);
    if (error) {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("media").getPublicUrl(fileName);
      onRecorded(data.publicUrl);
    }
    setUploading(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (uploading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="w-5 h-5 animate-spin" />
      </Button>
    );
  }

  return recording ? (
    <div className="flex items-center gap-2">
      <span className="text-xs text-destructive animate-pulse">● {formatTime(duration)}</span>
      <Button variant="ghost" size="icon" onClick={stopRecording}>
        <Square className="w-5 h-5 text-destructive" />
      </Button>
    </div>
  ) : (
    <Button variant="ghost" size="icon" onClick={startRecording} disabled={disabled}>
      <Mic className="w-5 h-5" />
    </Button>
  );
};

export default VoiceRecorder;
