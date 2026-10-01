import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  CalendarCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../../services/storageService';

interface PaidBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

export const PaidBookingModal: React.FC<PaidBookingModalProps> = ({
  isOpen,
  onClose,
  defaultService = 'Prophetic Consultation & Prayer'
}) => {
  const currentUser = StorageService.getCurrentUser();
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.phone ? `${currentUser.phone.replace(/[^0-9]/g, '')}@gatewayzim.org` : 'believer@gatewayzim.org');
  const [location, setLocation] = useState(currentUser?.cell_group || currentUser?.location || 'Harare, Zimbabwe');
  const [serviceType, setServiceType] = useState(defaultService);
  const [bookingDate, setBookingDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00 AM CAT');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  if (!isOpen) return null;

  const apostleWhatsAppNumber = '263771445642';

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const text = `*1-on-1 Pastoral Consultation Request*\n\n` +
      `*Apostle Joe Daniels Ministry Consultation Desk*\n` +
      `👤 *Name:* ${fullName.trim()}\n` +
      `📱 *Phone:* ${phone.trim()}\n` +
      `📍 *Location:* ${location.trim()}\n` +
      `🗓 *Preferred Date:* ${bookingDate}\n` +
      `⏰ *Preferred Time:* ${bookingTime}\n` +
      `🕊 *Consultation Focus:* ${serviceType}\n` +
      (notes.trim() ? `📝 *Notes/Prayer Topic:* ${notes.trim()}\n` : '') +
      `\n_Sent via Joe Daniels Connect App_`;

    const encoded = encodeURIComponent(text);
    const directWaUrl = `https://wa.me/${apostleWhatsAppNumber}?text=${encoded}`;
    setWhatsappUrl(directWaUrl);

    // Save to service bookings
    StorageService.createBooking({
      user_name: fullName.trim(),
      user_phone: phone.trim(),
      user_email: email.trim(),
      service_type: serviceType as any,
      date: bookingDate,
      time_slot: bookingTime,
      deposit_amount: 0,
      deposit_paid: true,
      notes: `Location: ${location.trim()} | Platform: WhatsApp (+263771445642) | Notes: ${notes.trim() || 'Apostolic consultation session with Apostle Joe Daniels'}`,
      reminder_phone: phone.trim()
    });

    try {
      confetti({ particleCount: 45, spread: 80, origin: { y: 0.5 } });
    } catch {}

    setIsSubmitted(true);
    // Automatically open WhatsApp in new tab/app
    window.open(directWaUrl, '_blank');
  };

  const handleCopyMessage = () => {
    const text = `1-on-1 Pastoral Consultation with Apostle Joe Daniels\nDate: ${bookingDate} @ ${bookingTime}\nTopic: ${serviceType}\nWhatsApp Desk: +263 77 144 5642\nMember: ${fullName} (${phone})`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-auto text-foreground">
        
        {/* Header */}
        <div className="bg-secondary/40 p-3.5 sm:p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-semibold shadow-xs shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Pastoral Consultation
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  WhatsApp 1-on-1
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Direct booking with Apostle Joe Daniels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View after submission */}
        {isSubmitted ? (
          <div className="p-4 sm:p-5 text-center space-y-3.5 overflow-y-auto flex-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-foreground">
                Consultation Request Prepared!
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Your 1-on-1 pastoral session request is ready to send directly to Apostle Joe Daniels on WhatsApp.
              </p>
            </div>

            {/* Consultation Pass Card */}
            <div className="bg-secondary/30 border border-border rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary">COUNSELOR & PASTOR</span>
                  <p className="text-xs font-bold text-foreground">Apostle Joe Daniels (General Overseer)</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold">
                  WHATSAPP DIRECT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground text-[10px]">PREFERRED DATE</span>
                  <p className="text-foreground font-semibold">{bookingDate} • {bookingTime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">CONSULTATION</span>
                  <p className="text-primary font-semibold truncate">{serviceType}</p>
                </div>
              </div>

              <div className="bg-secondary/50 p-2.5 rounded-xl border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground">DIRECT WHATSAPP DESK</span>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  +263 77 144 5642
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Tap below to open WhatsApp and message Apostle Joe Daniels directly.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                id="btn-launch-whatsapp-session"
                onClick={handleOpenWhatsApp}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp Chat with Apostle</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyMessage}
                  className="py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Details!' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="p-4 sm:p-5 space-y-3.5 flex-1 min-h-0 overflow-y-auto">
            {/* Beneficiary Badge */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
              <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Connect directly with Apostle Joe Daniels on WhatsApp for prayer and pastoral guidance.</span>
            </div>

            {/* Personal Details */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    WhatsApp Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+263..."
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Location / City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Harare"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Focus */}
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Consultation Focus *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
              >
                <option value="Prophetic Consultation & Prayer">Prophetic Consultation & Prayer</option>
                <option value="Deliverance & Spiritual Counseling">Deliverance & Spiritual Counseling</option>
                <option value="Marriage & Family Guidance">Marriage & Family Guidance</option>
                <option value="Kingdom Business Direction">Kingdom Business Direction</option>
                <option value="General Pastoral Counseling">General Pastoral Counseling</option>
              </select>
            </div>

            {/* Date & Time Slot */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>Preferred Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>Time Slot</span>
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
                >
                  <option value="09:00 AM CAT">09:00 AM CAT</option>
                  <option value="10:00 AM CAT">10:00 AM CAT</option>
                  <option value="11:30 AM CAT">11:30 AM CAT</option>
                  <option value="02:00 PM CAT">02:00 PM CAT</option>
                  <option value="04:00 PM CAT">04:00 PM CAT</option>
                  <option value="06:00 PM CAT">06:00 PM CAT</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Brief Discussion Background / Prayer Points (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly state what you would like Apostle Joe Daniels to minister to you about..."
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-whatsapp-booking"
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Connect with Apostle on WhatsApp</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
