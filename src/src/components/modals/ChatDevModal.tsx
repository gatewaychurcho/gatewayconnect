import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Code2, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Bot
} from 'lucide-react';
import { StorageService, arePhoneNumbersEqual } from '../../services/storageService';
import { liveSyncService } from '../../services/liveSyncService';

interface ChatDevModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMsg {
  id: string;
  sender: 'dev' | 'user';
  text: string;
  time: string;
}

export const ChatDevModal: React.FC<ChatDevModalProps> = ({ isOpen, onClose }) => {
  const currentUser = StorageService.getCurrentUser();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState('');

  // Hydrate messages from StorageService
  const loadMessages = () => {
    if (!currentUser) return;
    const dms = StorageService.getDirectMessages(currentUser.id, 'usr_developer', currentUser.id);
    const mapped: ChatMsg[] = dms.map(d => {
      const isDev = d.sender_id === 'usr_developer' || arePhoneNumbersEqual(d.sender_id, '0780699988');
      return {
        id: d.id,
        sender: isDev ? 'dev' : 'user',
        text: d.text,
        time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });
    setMessages(mapped);
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, currentUser?.id]);

  // Listen for incoming live direct messages and app sync events
  useEffect(() => {
    const handler = (e: any) => {
      loadMessages();
    };
    window.addEventListener('gcz_direct_messages_updated', handler);
    window.addEventListener('gcz_dms_updated', handler);
    window.addEventListener('gcz_live_event_received', handler);
    return () => {
      window.removeEventListener('gcz_direct_messages_updated', handler);
      window.removeEventListener('gcz_dms_updated', handler);
      window.removeEventListener('gcz_live_event_received', handler);
    };
  }, [currentUser?.id]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    // Dispatch message to developer's inbox and trigger notification
    StorageService.sendDirectMessage(currentUser.id, 'usr_developer', inputText.trim());
    StorageService.addAppNotification({
      type: 'chat',
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      actor_avatar: currentUser.avatar_url,
      title: `Message from ${currentUser.full_name}`,
      message: inputText.trim(),
      recipient_id: 'usr_developer'
    });

    loadMessages();
    setInputText('');
  };

  const handleWhatsAppDev = () => {
    const text = encodeURIComponent(
      `Hello Lead Developer mrjuice017 (+263780699988), I am contacting you from Gateway Connect App!`
    );
    window.open(`https://wa.me/263780699988?text=${text}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-end sm:items-center justify-end sm:justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in slide-in-from-bottom-5 duration-200 text-foreground flex flex-col h-[520px] max-h-[85vh]"
      >
        
        {/* Header */}
        <div className="bg-secondary/40 p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card absolute -bottom-0.5 -right-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-foreground">
                  Developer Support
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-primary font-mono border border-border">
                  mrjuice017
                </span>
              </div>
              <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                <span>Online</span> • <span className="text-muted-foreground">Innovative Technology</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWhatsAppDev}
              title="Open WhatsApp"
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              id="btn-close-chat-dev"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Contact Banner */}
        <div className="bg-secondary/30 px-4 py-2 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <span>Direct Dev Line: <strong className="font-mono text-foreground">+263780699988</strong></span>
          <button
            onClick={handleWhatsAppDev}
            className="text-emerald-500 hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
              <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary">
                <Code2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-foreground">Direct Channel to Lead Developer</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Type your inquiry below to connect directly with @mr_juice7 regarding bug reports, feature requests, or technical support.
              </p>
            </div>
          )}
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-xs shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-secondary text-foreground border border-border rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
                {m.time}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-secondary/40 border-t border-border flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type your message to developer..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
