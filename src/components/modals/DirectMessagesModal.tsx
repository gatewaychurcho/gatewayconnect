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
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update local state
    setMessages(prev => [...prev, userMsg]);

    // Broadcast to peers
    liveSyncService.broadcastEvent({ type: 'direct_message', payload: userMsg });

    // Optional: notify app
    StorageService.addAppNotification({
      id: 'notif_' + Date.now(),
      title: 'Message Sent',
      body: userMsg.text,
      time: userMsg.time
    });

    setInputText('');
  };

  const handleWhatsAppDev = () => {
    window.open('https://wa.me/263771234567', '_blank'); // replace with real dev number
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#001122] border border-purple-500 rounded-lg w-full max-w-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Bot className="text-purple-400" /> Developer Support
          </h2>
          <button onClick={onClose}><X className="text-white" /></button>
        </div>
        <div className="h-64 overflow-y-auto border border-gray-700 rounded p-2 mb-4">
          {messages.map(msg => (
            <div key={msg.id} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <span className="text-sm text-gray-300">{msg.text}</span>
              <div className="text-xs text-gray-500">{msg.time}</div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 bg-gray-800 text-white rounded px-2 py-1 mr-2"
            placeholder="Type a message..."
          />
          <button type="submit" className="bg-purple-600 text-white px-3 py-1 rounded flex items-center gap-1">
            <Send size={16} /> Send
          </button>
        </form>
        <div className="mt-4 flex justify-between">
          <button onClick={handleWhatsAppDev} className="text-green-400 flex items-center gap-1">
            <Phone size={16} /> WhatsApp Dev
          </button>
          <button onClick={() => window.open('https://github.com/gatewayconnect', '_blank')} className="text-blue-400 flex items-center gap-1">
            <Code2 size={16} /> GitHub
          </button>
        </div>
      </div>
    </div>
  );
};
