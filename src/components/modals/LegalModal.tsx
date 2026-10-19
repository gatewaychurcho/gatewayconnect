import React from 'react';
import { ShieldCheck, FileText, X, Check, Lock, ExternalLink } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              {type === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Joe Daniels Connect • Gateway Church International (Harare, Zimbabwe)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-foreground/90 space-y-5 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div>
                <p className="text-muted-foreground text-[11px]">Last Updated: October 2026</p>
                <p className="mt-2">
                  Welcome to <strong>Joe Daniels Connect</strong>, the official digital fellowship and ministerial platform of <strong>Gateway Church International</strong> under the apostolic leadership of Apostle Joe Daniels. Your privacy and trust are paramount to us. This Privacy Policy details how we handle, protect, and process your personal information.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>1. Information We Collect</span>
                </h4>
                <p>When you create an account, register for church events, or sow seed offerings, we collect:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li><strong>Identity Data:</strong> Full name, church assembly/city, spiritual interest, date of birth, gender, and membership ID.</li>
                  <li><strong>Contact Data:</strong> Mobile phone number, country code, and email address for account security and SMS notifications.</li>
                  <li><strong>Spiritual & Community Records:</strong> Baptism dates, testimonies shared, prayer requests submitted, and cell group affiliations.</li>
                  <li><strong>Giving & Financial Data:</strong> Transaction references for tithes, seed offerings, and church store purchases processed via EcoCash, OneMoney, Paynow, or card. <em>We never store credit card numbers or mobile PINs on our servers.</em></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>2. How We Use Your Information</span>
                </h4>
                <p>We use your information exclusively for church fellowship and ministerial purposes:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>To provide authenticated access to sermons, devotionals, offline audio scriptures, and interactive community fellowship.</li>
                  <li>To generate official digital receipts for tithes, offerings, and church store orders.</li>
                  <li>To coordinate pastoral counseling, mentorship sessions, and 1-on-1 ministerial appointments.</li>
                  <li>To send service alerts, prayer notifications, and live stream broadcast announcements.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>3. Privacy Protection & Anonymous Giving</span>
                </h4>
                <p>
                  We believe giving is a sacred act between you and God. You may choose to mark any donation or seed offering as <strong>"Anonymous"</strong>, which ensures your name is excluded from all public displays, impact tickers, and church screens.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>4. Data Security & Storage</span>
                </h4>
                <p>
                  All data is encrypted in transit using industry-standard TLS/SSL protocols and stored in secure, access-controlled cloud infrastructure (including Cloudflare R2 and hardened database endpoints). We strictly do not sell, rent, or trade your data to third-party commercial advertisers.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>5. Your Rights & Account Deletion</span>
                </h4>
                <p>
                  You have the right to request access to your personal records, update your account details at any time through the "Me" profile tab, or request complete deletion of your account and personal history by contacting the ministry desk.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>6. Contact Us</span>
                </h4>
                <p className="text-muted-foreground">
                  Gateway Church International Cathedral Office<br />
                  Fantasyland / Samora Machel Ave West, Harare, Zimbabwe<br />
                  Email: <strong>legal@gatewaychurch.org</strong> | Phone: <strong>+263 77 144 5642</strong>
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-muted-foreground text-[11px]">Last Updated: October 2026</p>
                <p className="mt-2">
                  These Terms and Conditions govern your use of the <strong>Joe Daniels Connect</strong> web and mobile application. By accessing or registering an account, you agree to enter into fellowship under these terms.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>1. Fellowship & Community Ethics</span>
                </h4>
                <p>Joe Daniels Connect is consecrated for spiritual growth, prayer, and edification. All users agree to:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Treat fellow believers, church leadership, and pastors with honor, dignity, and Christian love.</li>
                  <li>Never post abusive, defamatory, sexually suggestive, fraudulent, or harassing content.</li>
                  <li>Ensure testimonies, prayer requests, and praise reports shared are genuine and truthful.</li>
                  <li>Respect community group guidelines and adhere to moderator guidance.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>2. Account Security & Verification</span>
                </h4>
                <p>
                  You are responsible for maintaining the confidentiality of your login credentials and password. Users verified with Kingdom Badges (Gold, Silver, Blue) have undergone verification by Gateway Church leadership. Any impersonation of church ministers or leadership will result in immediate permanent account termination.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>3. Tithes, Offerings & Purchases</span>
                </h4>
                <p>
                  All tithes, seed faith offerings, and donations made on the platform are voluntary religious contributions supporting church development, missionary work, and charity. All physical merchandise ordered through the Kingdom Store is subject to local pickup or registered courier dispatch.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>4. Pastoral Consultations & Bookings</span>
                </h4>
                <p>
                  Sessions booked with Apostle Joe Daniels or appointed pastoral staff are spiritual mentorship, counseling, and prayer impartation. They are spiritual in nature and do not replace legal, financial, or certified medical advice.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>5. Intellectual Property</span>
                </h4>
                <p>
                  All sermons, podcasts, audio recordings, published devotionals, and ministerial trademarks are the exclusive intellectual property of Apostle Joe Daniels and Gateway Church International. You may stream and download content for personal, non-commercial devotion.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>6. Governing Law</span>
                </h4>
                <p className="text-muted-foreground">
                  These Terms are governed by and construed in accordance with the laws of the Republic of Zimbabwe.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Protected & Enforced Platform Policies</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
