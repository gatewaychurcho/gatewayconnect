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
import { PaynowService } from '../../services/paynowService';

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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultGatewayZoomUrl = 'https://zoom.us/j/81239019284?pwd=GATEWAY_CONNECT';
  const meetingId = '812 3901 9284';
  const meetingPasscode = 'GATEWAY';

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeZoomUrl = (zoomMode === 'custom_link' && customZoomLink.trim()) 
      ? customZoomLink.trim() 
      : defaultGatewayZoomUrl;

    setPaymentError(null);
    const payment = await PaynowService.initiateTransaction({
      reference: `GCZ-BOOKING-${Date.now().toString().slice(-8)}`,
      amount: serviceType.includes('Prophetic') ? 50 : 30,
      additionalInfo: `Pastoral booking - ${serviceType}`,
      phone: phone.trim(),
      paymentMethod: 'EcoCash'
    });
    if (!payment.success || !payment.pollUrl) {
      setPaymentError(payment.error || 'Payment could not be started. Booking was not created.');
      return;
    }
    if (payment.browserUrl) window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
    const result = await PaynowService.waitForPayment(payment.pollUrl);
    if (!result.isPaid) {
      setPaymentError(`Payment status: ${result.status}. Booking was not created.`);
      return;
    }
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[60vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-auto text-foreground">
        
        {/* Header */}
        <div className="bg-secondary/40 p-3.5 sm:p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-semibold shadow-xs shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Zoom Meetings Portal
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                  1-on-1
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Apostle Joe Daniels consultation request
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

        {/* Live Meetings Portal View after submission */}
        {isSubmitted ? (
          <div className="p-4 sm:p-5 text-center space-y-3.5 overflow-y-auto flex-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-foreground">
                Request Submitted Successfully!
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Your 1-on-1 session request has been submitted to Apostle Joe Daniels. You can join directly or share your invite link when scheduled.
              </p>
            </div>

            {/* Meeting Pass Card */}
            <div className="bg-secondary/30 border border-border rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary">HOST & COUNSELOR</span>
                  <p className="text-xs font-bold text-foreground">Apostle Joe Daniels (General Overseer)</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold">
                  PORTAL ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground text-[10px]">DATE & TIME</span>
                  <p className="text-foreground font-semibold">{bookingDate} • {bookingTime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">CONSULTATION</span>
                  <p className="text-primary font-semibold truncate">{serviceType}</p>
                </div>
              </div>

              <div className="bg-secondary/50 p-2.5 rounded-xl border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground">ZOOM MEETING LINK</span>
                <p className="text-xs font-mono text-primary break-all select-all">
                  {confirmedZoomUrl}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 font-mono">
                  <span>Meeting ID: <strong className="text-foreground">{meetingId}</strong></span>
                  <span>Passcode: <strong className="text-foreground">{meetingPasscode}</strong></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                id="btn-launch-zoom-session"
                onClick={handleLaunchZoom}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Launch Zoom Meeting Room Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyMeetingLink}
                  className="py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Invitation!' : 'Copy Zoom Link'}</span>
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
            {paymentError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {paymentError}
              </div>
            )}
            
            <div className="bg-secondary/30 p-3 rounded-2xl border border-border text-xs text-muted-foreground flex items-start gap-2.5">
              <Video className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Connect directly with <strong className="text-foreground">Apostle Joe Daniels</strong> via our interactive <strong className="text-primary">Zoom Meetings Portal</strong>. You can use the official Gateway Zoom room or send your personal Zoom link!
              </p>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-primary" />
                  <span>Your Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tinashe Chikwava"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+263 77..."
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            {/* Location & Service Focus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>Location / Country</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Harare / UK / USA / Diaspora"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Consultation Focus</span>
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
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
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>Preferred Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>Time Preference (CAT)</span>
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
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
            <div className="space-y-2 bg-secondary/30 p-3 rounded-2xl border border-border">
              <label className="block text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                <span>Zoom Connection Preference</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setZoomMode('gateway_room')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-all text-left cursor-pointer ${
                    zoomMode === 'gateway_room'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Gateway Zoom Room
                </button>

                <button
                  type="button"
                  onClick={() => setZoomMode('custom_link')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-all text-left cursor-pointer ${
                    zoomMode === 'custom_link'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
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
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Apostle Joe Daniels will join using the link you provide.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground pt-0.5">
                  The system will connect you to Apostle Joe Daniels via official room (ID: <strong className="text-foreground">{meetingId}</strong>).
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Brief Discussion Background (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Give a brief description of what you wish to discuss..."
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-paid-booking"
              type="submit"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
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
