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
  Sparkles
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
  const [location, setLocation] = useState(currentUser?.cell_group || currentUser?.location || 'Harare, Zimbabwe');
  const [serviceType, setServiceType] = useState(defaultService);
  const [bookingDate, setBookingDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00 AM CAT');
  const [sessionFormat, setSessionFormat] = useState<'In-Person (Belvedere Cathedral)' | 'Private Zoom Video' | 'Direct Phone Call'>('Private Zoom Video');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const MINISTRY_REPRESENTATIVE_PHONE = '+263780699988';
  const WA_CLEAN_PHONE = '263780699988';

  if (!isOpen) return null;

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();

    // Compile WhatsApp message for the representative at +263780699988
    const messageText = `*PAID 1-ON-1 PASTORAL CONSULTATION BOOKING*
----------------------------------------
*Name:* ${fullName.trim()}
*Phone:* ${phone.trim()}
*Location:* ${location.trim()}
*Preferred Date:* ${bookingDate}
*Preferred Time:* ${bookingTime}
*Session Format:* ${sessionFormat}
*Ministry Focus:* ${serviceType}
*Notes/Prayer Request:* ${notes.trim() || 'Seeking apostolic guidance and impartation.'}
----------------------------------------
_Submitted via Gateway Connect Official App for review and payment scheduling._`;

    // Save locally
    const existing = JSON.parse(localStorage.getItem('user_service_bookings') || '[]');
    existing.push({
      id: `book_${Date.now()}`,
      name: fullName,
      phone,
      location,
      date: bookingDate,
      time: bookingTime,
      service: serviceType,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('user_service_bookings', JSON.stringify(existing));

    confetti({ particleCount: 35, spread: 70, origin: { y: 0.5 } });
    setIsSubmitted(true);

    // Open WhatsApp directly to +263780699988
    const waUrl = `https://wa.me/${WA_CLEAN_PHONE}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-[#D4AF37]/50 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white">
        
        {/* Header */}
        <div className="bg-[#001122] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                Book 1-on-1 Pastoral Session
              </h3>
              <p className="text-[11px] text-[#D4AF37] font-medium">
                Paid Consultation • Reviewed at {MINISTRY_REPRESENTATIVE_PHONE}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body or Success State */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white">
                Booking Request Dispatched!
              </h4>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
                Your consultation request has been forwarded directly to the ministry intake team at <strong className="text-[#D4AF37] font-mono">{MINISTRY_REPRESENTATIVE_PHONE}</strong>. They will confirm the fee arrangement and coordinate your session.
              </p>
            </div>

            <div className="p-3 bg-[#001122] rounded-xl border border-white/10 text-left text-xs space-y-1 font-mono">
              <p className="text-white/80"><span className="text-white/40">Applicant:</span> {fullName}</p>
              <p className="text-white/80"><span className="text-white/40">Location:</span> {location}</p>
              <p className="text-white/80"><span className="text-white/40">Slot:</span> {bookingDate} @ {bookingTime}</p>
              <p className="text-white/80"><span className="text-white/40">Dispatched To:</span> {MINISTRY_REPRESENTATIVE_PHONE}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs rounded-xl shadow transition-all"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="p-4 sm:p-5 space-y-3.5">
            
            <div className="bg-[#001122] p-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-white/80 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                This is a <strong className="text-[#D4AF37]">paid 1-on-1 pastoral session</strong>. Fill in where you are and when you would like to meet. Submitting connects you directly to <strong className="text-white font-mono">{MINISTRY_REPRESENTATIVE_PHONE}</strong> who handles your booking.
              </p>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#D4AF37]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#001122] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#D4AF37]" />
                  <span>Your Phone / WhatsApp</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+263 77..."
                  className="w-full bg-[#001122] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Location & Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  <span>Your Location (Where you are)</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Harare / London / Bulawayo"
                  className="w-full bg-[#001122] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  <span>Ministry Focus</span>
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#001122] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Prophetic Consultation & Prayer">Prophetic Consultation & Prayer</option>
                  <option value="Deliverance & Spiritual Warfare">Deliverance & Spiritual Warfare</option>
                  <option value="Pastoral & Family Counseling">Pastoral & Family Counseling</option>
                  <option value="Business & Wealth Impartation">Business & Wealth Impartation</option>
                  <option value="Premarital Guidance">Premarital Guidance</option>
                </select>
              </div>
            </div>

            {/* Preferred Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#D4AF37]" />
                  <span>When you want to book (Date)</span>
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#001122] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>Time Preference</span>
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-[#001122] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="09:30 AM CAT">09:30 AM CAT (Morning)</option>
                  <option value="11:30 AM CAT">11:30 AM CAT (Midday)</option>
                  <option value="02:30 PM CAT">02:30 PM CAT (Afternoon)</option>
                  <option value="05:00 PM CAT">05:00 PM CAT (Evening)</option>
                  <option value="08:00 PM CAT">08:00 PM CAT (Diaspora Evening)</option>
                </select>
              </div>
            </div>

            {/* Session Format */}
            <div>
              <label className="block text-[11px] font-semibold text-white/80 mb-1">
                Meeting Preference
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {(['Private Zoom Video', 'In-Person (Belvedere Cathedral)', 'Direct Phone Call'] as const).map(fmt => (
                  <button
                    type="button"
                    key={fmt}
                    onClick={() => setSessionFormat(fmt)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                      sessionFormat === fmt
                        ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37]'
                        : 'bg-[#001122] border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    {fmt.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Discussion Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-white/80 mb-1">
                Brief Discussion Background (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Give a brief description of what you wish to discuss..."
                className="w-full bg-[#001122] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-paid-booking"
              type="submit"
              className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>Submit Booking to {MINISTRY_REPRESENTATIVE_PHONE}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
