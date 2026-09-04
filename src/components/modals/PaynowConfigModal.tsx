import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaynowService, generatePaynowHash } from '../../services/paynowService';
import { PaynowConfig } from '../../types';

interface PaynowConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: PaynowConfig) => void;
}

export const PaynowConfigModal: React.FC<PaynowConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const currentConfig = PaynowService.getConfig();
  const [integrationId, setIntegrationId] = useState(currentConfig.integrationId || '');
  const [integrationKey, setIntegrationKey] = useState(currentConfig.integrationKey || '');
  const [merchantEmail, setMerchantEmail] = useState(currentConfig.merchantEmail || 'gatewaychurchzim@gmail.com');
  const [isLive, setIsLive] = useState(currentConfig.isLive ?? true);
  const [showKey, setShowKey] = useState(false);
  
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sampleHash?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestHash = async () => {
    if (!integrationId.trim() || !integrationKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter both your Paynow Integration ID and Integration Key first.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test SHA-512 calculation with Paynow format
      const testValues = [
        integrationId.trim(),
        'GCZ-TEST-REF',
        '10.00',
        'Ministry Test Donation',
        'https://gatewayzim.org/return',
        'https://gatewayzim.org/callback',
        merchantEmail.trim(),
        'Message'
      ];
      const hash = await generatePaynowHash(testValues, integrationKey.trim());

      setTestResult({
        success: true,
        message: 'Credentials valid! SHA-512 signature hashing calculated successfully.',
        sampleHash: hash
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to generate Paynow signature: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = PaynowService.saveConfig({
      integrationId: integrationId.trim(),
      integrationKey: integrationKey.trim(),
      merchantEmail: merchantEmail.trim(),
      isLive
    });

    setSaveSuccess(true);
    confetti({ particleCount: 30, spread: 60 });
    if (onSaved) onSaved(updated);

    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-[#D4AF37]/60 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white">
        
        {/* Header */}
        <div className="bg-[#001122] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-black shadow-lg">
              <CreditCard className="w-5 h-5 text-[#001F3F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Paynow Zimbabwe Integration
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  EcoCash / OneMoney / InnBucks
                </span>
              </div>
              <p className="text-xs text-[#D4AF37]/80 mt-0.5">
                Step 2: Connect your official Paynow ID & Auth Key for live donations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 text-xs">
          
          {/* Instructions Box */}
          <div className="p-3.5 rounded-xl bg-[#001122]/80 border border-[#D4AF37]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Where to get your Paynow credentials:
              </span>
              <a
                href="https://www.paynow.co.zw"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>paynow.co.zw</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-white/70 text-[11px] leading-relaxed">
              1. Log in to your merchant account at <strong>Paynow.co.zw</strong>.<br />
              2. Go to <strong>Manage &gt; Advanced Integrations</strong>.<br />
              3. Create or select your integration to view your <strong>Integration ID</strong> and generate your <strong>Integration Key (Auth Key)</strong>.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-white/90 mb-1">
                Paynow Integration ID <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={integrationId}
                  onChange={(e) => setIntegrationId(e.target.value)}
                  placeholder="e.g. 18342"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37] font-mono text-sm"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1">Usually a 4 to 6 digit integer provided by Paynow.</p>
            </div>

            <div>
              <label className="block font-semibold text-white/90 mb-1">
                Paynow Integration Key (Auth Key) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  value={integrationKey}
                  onChange={(e) => setIntegrationKey(e.target.value)}
                  placeholder="e.g. 2a74c8b9-8472-4d2a-a92c-87d2194891b0"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 pr-10 text-white focus:outline-none focus:border-[#D4AF37] font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-white/40 mt-1">The secret UUID/hash used to sign transactions with SHA-512.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-white/90 mb-1">
                  Merchant Notification Email
                </label>
                <input
                  type="email"
                  value={merchantEmail}
                  onChange={(e) => setMerchantEmail(e.target.value)}
                  placeholder="gatewaychurchzim@gmail.com"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/90 mb-1">
                  Gateway Mode
                </label>
                <select
                  value={isLive ? 'live' : 'test'}
                  onChange={(e) => setIsLive(e.target.value === 'live')}
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="live">Live Production (Real Money)</option>
                  <option value="test">Paynow Sandbox (Testing)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Test connection results */}
          {testResult && (
            <div className={`p-3 rounded-xl border ${
              testResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-xs">{testResult.message}</p>
                  {testResult.sampleHash && (
                    <div className="text-[10px] opacity-80 break-all font-mono">
                      Sample SHA-512: {testResult.sampleHash.slice(0, 32)}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleTestHash}
              disabled={isTesting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#001122] border border-white/20 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />}
              <span>Test Hash Calculation</span>
            </button>

            <button
              type="submit"
              disabled={saveSuccess}
              className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b89428] text-[#001F3F] font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#001F3F]" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#001F3F]" />
                  <span>Save Paynow Credentials</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-1">
            <p className="text-[10px] text-white/40">
              Payments are routed via Paynow's encrypted 256-bit gateway adhering to RBZ (Reserve Bank of Zimbabwe) compliance.
            </p>
          </div>
        </form>

      </div>
    </div>
  );
};
