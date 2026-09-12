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
import { StorageService } from '../../services/storageService';
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

  // Listen for incoming live events
  useEffect(() => {
    const handler = (e: any) => {
      const event = e.detail;
      if (event.type === 'direct_message') {
        const msg = event.payload as ChatMsg;
        setMessages(prev => [...prev, msg]);
      }
    };
    window.addEventListener('gcz_live_event_received', handler);
    return () => window.removeEventListener('gcz_live_event_received', handler);
  }, []);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update local state
    setMessages(prev => [...prev, userMsg]);

    // Dispatch message to developer's inbox and trigger real notification on his bell
    StorageService.sendDirectMessage(currentUser.id, 'usr_developer', inputText.trim());
    StorageService.addAppNotification({
      type: 'chat',
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      actor_avatar: currentUser.avatar_url,
      title: `Message from ${currentUser.full_name}`,
      message: inputText.trim()
    });

    setInputText('');
  };

  const handleWhatsAppDev = () => {
    const text = encodeURIComponent(
      `Hello Lead Developer mrjuice017 (+263780699988), I am contacting you from Gateway Connect App!`
    );
    window.open(`https://wa.me/263780699988?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/80 backdrop-blur-sm flex items-end sm:items-center justify-end sm:justify-center p-3 sm:p-4">
      <div className="bg-[#001F3F] border border-purple-500/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-200 text-white flex flex-col h-[520px] max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#00172e] p-4 border-b border-purple-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black shadow">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#001F3F] absolute -bottom-0.5 -right-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">
                  Developer Support
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  mrjuice017
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span>Online</span> • <span>Innovative Technology</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWhatsAppDev}
              title="Open WhatsApp"
              className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              id="btn-close-chat-dev"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Contact Banner */}
        <div className="bg-purple-950/40 px-4 py-2 border-b border-purple-500/20 flex items-center justify-between text-[11px] text-purple-200 shrink-0">
          <span>Direct Dev Line: <strong className="font-mono text-white">+263780699988</strong></span>
          <button
            onClick={handleWhatsAppDev}
            className="text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
          >
            <span>WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/50 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Code2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-white/80">Direct Channel to Lead Developer</p>
              <p className="text-[11px] text-white/50 max-w-xs">
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
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                    : 'bg-[#00172e] text-white border border-purple-500/30 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-white/40 mt-1 px-1 font-mono">
                {m.time}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-[#00172e] border-t border-purple-500/20 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type your message to developer..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-[#001F3F] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
