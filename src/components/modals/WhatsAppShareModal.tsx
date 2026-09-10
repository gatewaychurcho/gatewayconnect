import React, { useState } from 'react';
import { Share2, X, Check, Copy, Send, Sparkles, BookOpen } from 'lucide-react';
import { Testimony } from '../../types';

interface WhatsAppShareModalProps {
  post: Testimony | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  post,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !post) return null;

  const appUrl = window.location.origin;
  const shareText = `*Gateway International Church Zimbabwe*\nLead Pastor: Apostle Joe Daniels\n\n📌 *${post.title}*\n${post.scripture_tag ? `📖 *Scripture:* ${post.scripture_tag}\n` : ''}"${post.content}"\n\n👤 Shared by: ${post.user_name} (${post.user_handle || '@gateway_member'})\n\n📲 Connect and read full prophetic testimonies in the Gateway App:\n${appUrl}`;

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-[92vw] sm:max-w-md bg-[#001122] border border-[#D4AF37]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="px-4 py-3 bg-[#00172e] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-[#D4AF37]">
              Share to WhatsApp
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Card Preview (Safe bounded box - No mobile screen overlap) */}
        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[70vh]">
          <div className="bg-[#001F3F] border border-white/15 rounded-2xl p-3.5 space-y-3 shadow-inner">
            
            {/* Church branding bar */}
            <div className="flex items-center justify-between text-[10px] text-white/60 pb-2 border-b border-white/10">
              <span className="font-bold text-[#D4AF37] tracking-wider uppercase">
                Gateway International Church
              </span>
              <span>Apostle Joe Daniels</span>
            </div>

            {/* Post Picture if available */}
            {post.image_url && (
              <div className="w-full rounded-xl overflow-hidden max-h-48 sm:max-h-56 bg-black/40 border border-white/10">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Scripture and Category pill row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                {post.category}
              </span>
              {post.scripture_tag && (
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold flex items-center gap-1">
                  <BookOpen className="w-2.5 h-2.5" />
                  <span>{post.scripture_tag}</span>
                </span>
              )}
            </div>

            {/* Post content */}
            <div className="space-y-1">
              <h4 className="font-bold text-xs sm:text-sm text-white leading-snug">
                {post.title}
              </h4>
              <p className="text-xs text-white/80 leading-relaxed italic line-clamp-4">
                "{post.content}"
              </p>
            </div>

            {/* Author stamp */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37]/40">
                <img
                  src={post.user_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                  alt={post.user_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-white block">{post.user_name}</span>
                <span className="text-white/40 text-[9px]">{post.user_handle || '@covenant_partner'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3.5 bg-[#00172e] border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
          <button
            id="btn-whatsapp-share-now"
            onClick={handleOpenWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Send className="w-4 h-4 -rotate-12" />
            <span>Open & Share to WhatsApp</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
