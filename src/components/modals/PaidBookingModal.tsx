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
  CreditCard,
  Sparkles,
  Video,
  Copy,
  Check,
  ExternalLink,
  Link2,
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
  
  // Zoom mode: generate gateway room or enter custom link
  const [zoomMode, setZoomMode] = useState<'gateway_room' | 'custom_link'>('gateway_room');
  const [customZoomLink, setCustomZoomLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmedZoomUrl, setConfirmedZoomUrl] = useState('');

  if (!isOpen) return null;

  const defaultGatewayZoomUrl = 'https://zoom.us/j/81239019284?pwd=GATEWAY_CONNECT';
  const meetingId = '812 3901 9284';
  const meetingPasscode = 'GATEWAY';

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();

    const activeZoomUrl = (zoomMode === 'custom_link' && customZoomLink.trim()) 
      ? customZoomLink.trim() 
      : defaultGatewayZoomUrl;

    setConfirmedZoomUrl(activeZoomUrl);

    // Save to service bookings
    StorageService.createBooking({
      user_name: fullName.trim(),
      user_phone: phone.trim(),
      user_email: email.trim(),
      service_type: serviceType as any,
      date: bookingDate,
      time_slot: bookingTime,
      deposit_amount: serviceType.includes('Prophetic') ? 50 : 30,
      deposit_paid: true,
      notes: `Location: ${location.trim()} | Zoom Mode: ${zoomMode} | User Notes: ${notes.trim() || 'Apostolic consultation session with Apostle Joe Daniels'}`,
      reminder_phone: phone.trim()
    });

    confetti({ particleCount: 45, spread: 80, origin: { y: 0.5 } });
    setIsSubmitted(true);
  };

  const handleCopyMeetingLink = () => {
    const inviteText = `Gateway Connect 1-on-1 Pastoral Meeting with Apostle Joe Daniels\nDate: ${bookingDate} @ ${bookingTime}\nTopic: ${serviceType}\nZoom Link: ${confirmedZoomUrl}\nMeeting ID: ${meetingId}\nPasscode: ${meetingPasscode}`;
    navigator.clipboard.writeText(inviteText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLaunchZoom = () => {
    window.open(confirmedZoomUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-[#D4AF37]/50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white">
        
        {/* Header */}
        <div className="bg-[#00172e] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black shadow-lg">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Zoom Meetings Portal
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40">
                  1-on-1 with Apostle Joe Daniels
                </span>
              </div>
              <p className="text-xs text-white/60">
                Direct live pastoral consultation & prophetic impartation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Meetings Portal View after submission */}
        {isSubmitted ? (
          <div className="p-5 sm:p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">
                Zoom Meeting Session Confirmed!
              </h4>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
                Your 1-on-1 session is synchronized into Apostle Joe Daniels' Meetings Portal. You can join directly or share your invite link.
              </p>
            </div>

            {/* Meeting Pass Card */}
            <div className="bg-[#001428] border border-blue-500/30 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-400">HOST & COUNSELOR</span>
                  <p className="text-xs font-bold text-white">Apostle Joe Daniels (General Overseer)</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  PORTAL ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-white/40 text-[10px]">DATE & TIME</span>
                  <p className="text-white font-bold">{bookingDate} • {bookingTime}</p>
                </div>
                <div>
                  <span className="text-white/40 text-[10px]">CONSULTATION</span>
                  <p className="text-[#D4AF37] font-bold truncate">{serviceType}</p>
                </div>
              </div>

              <div className="bg-[#001F3F] p-2.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] text-white/50">ZOOM MEETING LINK</span>
                <p className="text-xs font-mono text-blue-300 break-all select-all">
                  {confirmedZoomUrl}
                </p>
                <div className="flex items-center justify-between text-[10px] text-white/60 pt-1 font-mono">
                  <span>Meeting ID: <strong>{meetingId}</strong></span>
                  <span>Passcode: <strong>{meetingPasscode}</strong></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                id="btn-launch-zoom-session"
                onClick={handleLaunchZoom}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Video className="w-4 h-4" />
                <span>Launch Zoom Meeting Room Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyMeetingLink}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Invitation!' : 'Copy Zoom Link'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-bold text-xs shadow transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
            
            <div className="bg-[#001428] p-3 rounded-2xl border border-blue-500/30 text-xs text-white/80 flex items-start gap-2.5">
              <Video className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Connect directly with <strong className="text-white">Apostle Joe Daniels</strong> via our interactive <strong className="text-blue-400">Zoom Meetings Portal</strong>. You can use the official Gateway Zoom room or send your personal Zoom link!
              </p>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#D4AF37]" />
                  <span>Your Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tinashe Chikwava"
                  className="w-full bg-[#001428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#D4AF37]" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+263 77..."
                  className="w-full bg-[#001428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Location & Service Focus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  <span>Location / Country</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Harare / UK / USA / Diaspora"
                  className="w-full bg-[#001428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  <span>Consultation Focus</span>
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#001428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Prophetic Consultation & Prayer">Prophetic Consultation & Prayer</option>
                  <option value="Deliverance & Spiritual Warfare">Deliverance & Spiritual Warfare</option>
                  <option value="Pastoral & Family Counseling">Pastoral & Family Counseling</option>
                  <option value="Business & Wealth Impartation">Business & Wealth Impartation</option>
                  <option value="Premarital Guidance">Premarital Guidance</option>
                </select>
              </div>
            </div>

            {/* Date & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#D4AF37]" />
                  <span>Preferred Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#001428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>Time Preference (CAT)</span>
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-[#001428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="09:30 AM CAT">09:30 AM CAT (Morning)</option>
                  <option value="11:30 AM CAT">11:30 AM CAT (Midday)</option>
                  <option value="02:30 PM CAT">02:30 PM CAT (Afternoon)</option>
                  <option value="05:00 PM CAT">05:00 PM CAT (Evening)</option>
                  <option value="08:00 PM CAT">08:00 PM CAT (Diaspora Evening)</option>
                </select>
              </div>
            </div>

            {/* Zoom Meeting Link Configuration */}
            <div className="space-y-2 bg-[#001428] p-3 rounded-2xl border border-blue-500/20">
              <label className="block text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Zoom Connection Preference</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setZoomMode('gateway_room')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all text-left ${
                    zoomMode === 'gateway_room'
                      ? 'bg-blue-600 text-white border-blue-400 shadow'
                      : 'bg-[#001F3F] border-white/10 text-white/70 hover:border-white/20'
                  }`}
                >
                  Gateway Zoom Room
                </button>

                <button
                  type="button"
                  onClick={() => setZoomMode('custom_link')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all text-left ${
                    zoomMode === 'custom_link'
                      ? 'bg-blue-600 text-white border-blue-400 shadow'
                      : 'bg-[#001F3F] border-white/10 text-white/70 hover:border-white/20'
                  }`}
                >
                  Send My Personal Link
                </button>
              </div>

              {zoomMode === 'custom_link' ? (
                <div className="pt-1">
                  <input
                    type="url"
                    required
                    value={customZoomLink}
                    onChange={(e) => setCustomZoomLink(e.target.value)}
                    placeholder="Paste your Zoom/Teams meeting URL (https://zoom.us/j/...)"
                    className="w-full bg-[#001F3F] border border-blue-400/40 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none"
                  />
                  <p className="text-[10px] text-blue-200/70 mt-1">
                    Apostle Joe Daniels will join using the link you provide.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-white/60 pt-0.5">
                  The system will connect you to Apostle Joe Daniels via official room (ID: <strong>{meetingId}</strong>).
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-white/80 mb-1">
                Brief Discussion Background (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Give a brief description of what you wish to discuss..."
                className="w-full bg-[#001428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-paid-booking"
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.99]"
            >
              <Video className="w-4 h-4" />
              <span>Confirm & Enter Zoom Meetings Portal</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
