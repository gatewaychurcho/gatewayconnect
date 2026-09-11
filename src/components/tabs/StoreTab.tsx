import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Calendar, 
  CreditCard, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  Download, 
  Share2, 
  Video, 
  MessageCircle, 
  Clock, 
  User, 
  Mail, 
  ArrowRight, 
  Globe, 
  Receipt, 
  Zap, 
  Copy, 
  Smartphone,
  Truck,
  MapPin,
  X,
  Eye,
  Check,
  Tag,
  RotateCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, CartItem, DonationFund, PaymentGateway, Donation, ServiceBooking } from '../../types';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';
import { MoorsDepositModal } from '../modals/MoorsDepositModal';
import { PaynowConfigModal } from '../modals/PaynowConfigModal';

interface StoreTabProps {
  products: Product[];
  onDonationSuccess?: (donation: Donation) => void;
}

export const StoreTab: React.FC<StoreTabProps> = ({ products, onDonationSuccess }) => {
  const [subTab, setSubTab] = useState<'store' | 'give' | 'booking'>('store');
  const [currency, setCurrency] = useState<'USD' | 'ZiG' | 'GBP' | 'ZAR'>('USD');
  const currentUser = StorageService.getCurrentUser();
  
  // Cart State (Persisted in StorageService & Supabase database)
  const [cart, setCart] = useState<CartItem[]>(() => StorageService.getCart(currentUser?.id));
  const [showCartModal, setShowCartModal] = useState<boolean>(false);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Real-time Available Products (automatically hides out-of-stock items)
  const [availableProducts, setAvailableProducts] = useState<Product[]>(() => StorageService.getStoreAvailableProducts());

  useEffect(() => {
    const handleProductsUpdated = () => {
      setAvailableProducts(StorageService.getStoreAvailableProducts());
    };
    window.addEventListener('gcz_products_updated', handleProductsUpdated);
    window.addEventListener('storage', handleProductsUpdated);
    return () => {
      window.removeEventListener('gcz_products_updated', handleProductsUpdated);
      window.removeEventListener('storage', handleProductsUpdated);
    };
  }, []);

  // 3D Shirt Rotation State for Details/Eye Modal
  const [rotationY, setRotationY] = useState<number>(0);
  const [rotationX, setRotationX] = useState<number>(0);
  const [isDragging3D, setIsDragging3D] = useState<boolean>(false);
  const dragStartPos = useRef<{ x: number; y: number; initialY: number; initialX: number }>({ x: 0, y: 0, initialY: 0, initialX: 0 });

  // Cart Checkout & Delivery State
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderName, setOrderName] = useState<string>(currentUser?.full_name || 'Church Member');
  const [orderPhone, setOrderPhone] = useState<string>(currentUser?.phone || '0772123456');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<PaymentGateway>('EcoCash');
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  // Hydrate cart from Supabase and listen for external updates
  useEffect(() => {
    if (currentUser?.id) {
      StorageService.hydrateCartFromSupabase(currentUser.id).then(remoteCart => {
        if (remoteCart && remoteCart.length > 0) {
          setCart(remoteCart);
        }
      });
    }

    const handleCartUpdated = () => {
      setCart(StorageService.getCart(currentUser?.id));
    };
    window.addEventListener('gcz_cart_updated', handleCartUpdated);
    return () => window.removeEventListener('gcz_cart_updated', handleCartUpdated);
  }, [currentUser?.id]);

  // Giving Form State
  const [giveFund, setGiveFund] = useState<DonationFund>('Tithe');
  const [giveAmount, setGiveAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('EcoCash');
  const [donorPhone, setDonorPhone] = useState<string>(StorageService.getCurrentUser()?.phone || '0772123456');
  const [isAnonymousDonation, setIsAnonymousDonation] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<Donation | null>(null);
  const [showMoorsModal, setShowMoorsModal] = useState<boolean>(false);
  const [showPaynowConfigModal, setShowPaynowConfigModal] = useState<boolean>(false);
  const [copiedUssdCode, setCopiedUssdCode] = useState<boolean>(false);
  const [paynowRedirectUrl, setPaynowRedirectUrl] = useState<string | null>(null);
  const [paynowInstruction, setPaynowInstruction] = useState<string | null>(null);

  const PAYMENT_ACCOUNT_NUMBER = '0771445642';

  // 1-on-1 Booking Form State
  const [bookingService, setBookingService] = useState<ServiceBooking['service_type']>('Prophetic Mentorship');
  const [bookingDate, setBookingDate] = useState<string>('2026-09-15');
  const [bookingTime, setBookingTime] = useState<string>('02:00 PM CAT');
  const [bookingName, setBookingName] = useState<string>(StorageService.getCurrentUser()?.full_name || 'Church Member');
  const [bookingPhone, setBookingPhone] = useState<string>(StorageService.getCurrentUser()?.phone || '+263780699988');
  const [bookingLocation, setBookingLocation] = useState<string>(StorageService.getCurrentUser()?.cell_group || 'Harare, Zimbabwe');
  const [bookingEmail, setBookingEmail] = useState<string>('believer@gatewayzim.org');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<ServiceBooking | null>(null);
  const [bookingPaymentError, setBookingPaymentError] = useState<string | null>(null);

  // Currency Exchange helper
  const getPrice = (usd: number) => {
    if (currency === 'ZiG') return `${Math.round(usd * 14.8)} ZiG`;
    if (currency === 'GBP') return `£${Math.round(usd * 0.78)}`;
    if (currency === 'ZAR') return `R${Math.round(usd * 18.5)}`;
    return `$${usd.toFixed(2)} USD`;
  };

  const handleAddToCart = (product: Product, size?: string) => {
    const chosenSize = size || selectedSizes[product.id] || (product.available_sizes ? product.available_sizes[0] : 'M');
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === chosenSize);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(item => 
          (item.product.id === product.id && item.selectedSize === chosenSize)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        updated = [...prev, { product, quantity: 1, selectedSize: chosenSize }];
      }
      StorageService.setCart(updated, currentUser?.id);
      return updated;
    });
    setCartToast(`Added "${product.name}" (${chosenSize}) to cart`);
    setTimeout(() => setCartToast(null), 3000);
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.8 }
    });
  };

  const updateCartQuantity = (productId: string, delta: number, size?: string) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId && (!size || item.selectedSize === size)) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
      StorageService.setCart(updated, currentUser?.id);
      return updated;
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prev => {
      const updated = prev.filter(item => !(item.product.id === productId && (!size || item.selectedSize === size)));
      StorageService.setCart(updated, currentUser?.id);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    StorageService.setCart([], currentUser?.id);
  };

  const cartSubtotalUsd = cart.reduce((sum, item) => sum + (item.product.price_usd * item.quantity), 0);
  const deliveryFeeUsd = deliveryMethod === 'courier' ? 3.00 : 0.00;
  const totalCartUsd = cartSubtotalUsd + deliveryFeeUsd;
  const totalCartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProcessDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmt = customAmount ? parseFloat(customAmount) : giveAmount;
    if (!finalAmt || finalAmt <= 0) return;

    // For mobile money (EcoCash / OneMoney), open the interactive USSD prompt modal directly
    if (paymentGateway === 'EcoCash' || paymentGateway === 'OneMoney') {
      setShowMoorsModal(true);
      return;
    }

    const user = StorageService.getCurrentUser();
    const impactMap: Record<DonationFund, string> = {
      'Tithe': 'Ministry operations, broadcast satellites & pastoral sustenance',
      'Firstfruits': 'Altar dedication and new territory advancement in 2026',
      'Seed Faith': 'Harare Evangelistic Crusade & Souls outreach',
      'Building Foundation': 'Cathedral Roofing Phase 2 Construction in Belvedere',
      'Missions & Evangelism': 'Rural Mashonaland & Matabeleland church plants',
      'Apostolic Honorarium': 'Direct apostolic blessing and prophetic mantle honoring',
      'Altar Seed': 'Direct altar seed covenant offering & prophetic connection'
    };

    const refNumber = `GCZ-PAYNOW-${Date.now().toString().slice(-6)}`;
    let paynowPollUrl: string | undefined;

    // If payment gateway is Paynow, initiate with Paynow Zimbabwe
    if (paymentGateway === 'Paynow') {
      const paynowRes = await PaynowService.initiateTransaction({
        reference: refNumber,
        amount: finalAmt,
        additionalInfo: `${giveFund} - Gateway Church Zimbabwe`,
        phone: donorPhone,
        paymentMethod: 'Paynow'
      });

      if (paynowRes.browserUrl && !paynowRes.isSimulated) {
        window.open(paynowRes.browserUrl, '_blank');
      }
      if (!paynowRes.success) {
        setPaynowInstruction(paynowRes.error || 'Paynow could not start this payment. No funds were recorded.');
        return;
      }
      paynowPollUrl = paynowRes.pollUrl;
      if (paynowRes.browserUrl) {
        setPaynowRedirectUrl(paynowRes.browserUrl);
      }
      if (paynowRes.instructions) {
        setPaynowInstruction(paynowRes.instructions);
      }
    } else if (!['EcoCash', 'OneMoney'].includes(paymentGateway)) {
      setPaynowInstruction(`${paymentGateway} is not connected yet. Choose EcoCash, OneMoney, or Paynow so the payment can be verified securely.`);
      return;
    }

    const donation = StorageService.recordDonation({
      donor_id: user?.id || 'usr_guest',
      donor_name: isAnonymousDonation ? 'Anonymous Covenant Partner' : (user?.full_name || 'Covenant Partner'),
      amount: finalAmt,
      currency: currency,
      fund_type: giveFund,
      payment_method: paymentGateway,
      impact_tag: impactMap[giveFund] || 'Kingdom Advancement',
      is_anonymous: isAnonymousDonation
    }, paymentGateway === 'Paynow' ? 'pending' : 'completed');

    setActiveReceipt(donation);
    if (onDonationSuccess) {
      onDonationSuccess(donation);
    }

    if (paymentGateway === 'Paynow' && paynowPollUrl) {
      setPaynowInstruction('Payment started. Waiting for Paynow confirmation...');
      const paymentResult = await PaynowService.waitForPayment(paynowPollUrl);
      const finalDonation = StorageService.updateDonationStatus(
        donation.id,
        paymentResult.isPaid ? 'completed' : ['Cancelled', 'Failed'].includes(paymentResult.status) ? 'failed' : 'pending'
      );
      if (finalDonation) {
        setActiveReceipt(finalDonation);
        onDonationSuccess?.(finalDonation);
      }
      setPaynowInstruction(paymentResult.isPaid
        ? 'Payment confirmed by Paynow.'
        : `Payment status: ${paymentResult.status}. No paid receipt was issued.`);
    }
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleProcessBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingPaymentError(null);
    const depositAmount = bookingService === 'Prophetic Mentorship' ? 50 : 30;
    const payment = await PaynowService.initiateTransaction({
      reference: `GCZ-BOOKING-${Date.now().toString().slice(-8)}`,
      amount: depositAmount,
      additionalInfo: `Pastoral booking - ${bookingService}`,
      phone: bookingPhone,
      paymentMethod: 'EcoCash'
    });
    if (!payment.success || !payment.pollUrl) {
      setBookingPaymentError(payment.error || 'Payment could not be started. Booking was not confirmed.');
      return;
    }
    if (payment.browserUrl) window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
    const paymentResult = await PaynowService.waitForPayment(payment.pollUrl);
    if (!paymentResult.isPaid) {
      setBookingPaymentError(`Payment status: ${paymentResult.status}. Booking was not confirmed.`);
      return;
    }
    const newBooking = StorageService.createBooking({
      user_name: bookingName,
      user_phone: bookingPhone,
      user_email: bookingEmail,
      service_type: bookingService,
      date: bookingDate,
      time_slot: bookingTime,
      deposit_amount: depositAmount,
      deposit_paid: true,
      notes: `Location: ${bookingLocation} | ${bookingNotes}`,
      reminder_phone: bookingPhone
    });

    // Zoom session ready in Meetings Portal
    setConfirmedBooking(newBooking);
    confetti({
      particleCount: 40,
      spread: 70
    });
  };

  const handleProcessOrderCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;
    const finalAddress = deliveryMethod === 'courier' 
      ? (deliveryAddress.trim() || 'Harare Residential Delivery') 
      : 'Main Church Pick-up Desk / Belvedere Cathedral Hub';
      
    const processCheckout = async () => {
      const payment = await PaynowService.initiateTransaction({
        reference: `GCZ-ORDER-${Date.now().toString().slice(-8)}`,
        amount: totalCartUsd,
        additionalInfo: `Kingdom Store order - ${cart.length} item(s)`,
        phone: orderPhone,
        paymentMethod: orderPaymentMethod === 'OneMoney' ? 'OneMoney' : orderPaymentMethod === 'EcoCash' ? 'EcoCash' : 'Card'
      });
      if (!payment.success || !payment.pollUrl) {
        setCartToast(payment.error || 'Payment could not be started. The order was not created.');
        return;
      }
      if (payment.browserUrl) window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
      const result = await PaynowService.waitForPayment(payment.pollUrl);
      if (!result.isPaid) {
        setCartToast(`Payment status: ${result.status}. The order was not created.`);
        return;
      }

      const newOrder = StorageService.createOrder({
      user_name: orderName.trim() || 'Church Member',
      user_phone: orderPhone.trim() || '+263772123456',
      items: [...cart],
      total_usd: totalCartUsd,
      payment_method: orderPaymentMethod,
      delivery_address: finalAddress
      });

      setConfirmedOrder(newOrder);
      setCart([]);
      setShowCartModal(false);
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.5 } });
    };
    void processCheckout();
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-3 sm:px-4 pt-2">
      
      {/* 1. Header Toolbar with Sub-tabs and Currency Switcher */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif-church text-base sm:text-lg font-bold text-foreground">
            Gateway Store & Giving
          </h2>
          <p className="text-xs text-muted-foreground">
            Ministry publications, online giving & pastoral counseling
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-Tab Switcher */}
          <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg border border-border">
            <button
              id="tab-sub-store"
              onClick={() => setSubTab('store')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all relative ${
                subTab === 'store' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Store & Books
              {cart.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {cart.length}
                </span>
              )}
            </button>
            <button
              id="tab-sub-give"
              onClick={() => setSubTab('give')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'give' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Give & Tithe
            </button>
            <button
              id="tab-sub-booking"
              onClick={() => setSubTab('booking')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'booking' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              1-on-1 Sessions
            </button>
          </div>

          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-secondary border border-border text-foreground font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
          >
            <option value="USD">USD ($)</option>
            <option value="ZiG">ZiG (ZW)</option>
            <option value="GBP">GBP (£)</option>
            <option value="ZAR">ZAR (R)</option>
          </select>
        </div>
      </div>

      {/* 2. SUB-TAB: GIVING & DONATIONS */}
      {subTab === 'give' && (
        <div className="space-y-4">
          
          {/* Streamlined Mobile Money & Online Giving Account Card */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold uppercase">
                  Mobile Giving
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  EcoCash *151# Push Active
                </span>
              </div>
              
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Account Number:</span>
                <span className="text-base font-mono font-black text-foreground tracking-wider">
                  {PAYMENT_ACCOUNT_NUMBER}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(PAYMENT_ACCOUNT_NUMBER);
                    setCopiedUssdCode(true);
                    setTimeout(() => setCopiedUssdCode(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-[11px] text-foreground flex items-center gap-1 transition-all"
                  title="Copy Account Number"
                >
                  <Copy className="w-3 h-3 text-primary" />
                  <span>{copiedUssdCode ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Direct credit for Tithe, Firstfruits, Seed Faith & Building Fund.
              </p>
            </div>

            <button
              id="btn-open-moors-deposit"
              onClick={() => setShowMoorsModal(true)}
              className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Direct EcoCash Push</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Giving Form Card */}
            <div className="md:col-span-7 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-church font-bold text-base text-foreground">
                    Sow Your Seed
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Account: <strong className="text-primary">{PAYMENT_ACCOUNT_NUMBER}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleProcessDonation} className="space-y-3.5">
                {/* Fund Type Picker */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    Select Giving Fund
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(['Tithe', 'Firstfruits', 'Seed Faith', 'Building Foundation', 'Missions & Evangelism', 'Apostolic Honorarium', 'Altar Seed'] as DonationFund[]).map(fund => (
                      <button
                        type="button"
                        key={fund}
                        onClick={() => setGiveFund(fund)}
                        className={`p-2 rounded-lg text-left border transition-all text-xs font-semibold ${
                          giveFund === fund
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {fund}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Presets */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    Amount ({currency})
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[20, 50, 100, 250].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setGiveAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                          giveAmount === amt && !customAmount
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {currency === 'USD' ? `$${amt}` : currency === 'ZiG' ? `${amt * 15} ZiG` : `${currency} ${amt}`}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Or enter custom amount in ${currency}...`}
                    className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Payment Gateway Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground/80">
                      Payment Method (Target: {PAYMENT_ACCOUNT_NUMBER})
                    </label>
                    {StorageService.getCurrentUser()?.role === 'developer' && (
                      <button
                        type="button"
                        onClick={() => setShowPaynowConfigModal(true)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 font-mono flex items-center gap-1 transition-colors"
                      >
                        <span>⚙️ Paynow Config (Dev)</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['EcoCash', 'OneMoney', 'Paynow', 'Stripe', 'PayPal', 'Bank Transfer'] as PaymentGateway[]).map(gw => (
                      <button
                        type="button"
                        key={gw}
                        onClick={() => setPaymentGateway(gw)}
                        className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                          paymentGateway === gw
                            ? 'bg-primary/15 border-primary text-primary shadow-sm'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{gw === 'EcoCash' ? '📱 EcoCash' : gw === 'Paynow' ? '🇿🇼 Paynow' : gw === 'Stripe' ? '💳 Card / Stripe' : gw}</span>
                      </button>
                    ))}
                  </div>

                  {/* Paynow Quick Connect Banner (Developer Only) */}
                  {StorageService.getCurrentUser()?.role === 'developer' && (paymentGateway === 'Paynow' || paymentGateway === 'EcoCash') && (
                    <div className="mt-2 p-2.5 rounded-lg bg-secondary border border-border flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-muted-foreground">
                          {PaynowService.getConfig().isConfigured 
                            ? `Paynow Active (ID: ${PaynowService.getConfig().integrationId})` 
                            : 'Paynow Gateway Ready (Click to enter your ID & Auth Key)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPaynowConfigModal(true)}
                        className="text-primary font-bold hover:underline"
                      >
                        {PaynowService.getConfig().isConfigured ? 'Edit Keys' : 'Enter Credentials'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Phone / Mobile Prompt */}
                {(paymentGateway === 'EcoCash' || paymentGateway === 'OneMoney' || paymentGateway === 'Paynow') && (
                  <div className="bg-secondary/50 p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {paymentGateway} Mobile Number for USSD Push (*151#)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Target: {PAYMENT_ACCOUNT_NUMBER}
                      </span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="e.g. 0772123456 or 0712345678"
                      className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      A secure pin prompt will be sent directly to your phone to authorize transfer to <strong className="text-primary">{PAYMENT_ACCOUNT_NUMBER}</strong>.
                    </p>
                  </div>
                )}

                {/* Anonymous Checkbox */}
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isAnonymousDonation}
                    onChange={(e) => setIsAnonymousDonation(e.target.checked)}
                    className="rounded border-border accent-primary"
                  />
                  <span>Keep Donation Anonymous on Kingdom Impact Tickers</span>
                </label>

                {paynowInstruction && (
                  <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs text-foreground space-y-2">
                    <p>{paynowInstruction}</p>
                    {paynowRedirectUrl && (
                      <a href={paynowRedirectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline text-primary">
                        Open Paynow checkout
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  id="btn-submit-giving"
                  type="submit"
                  className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm uppercase tracking-wider shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Authorize Giving of {customAmount ? `${currency} ${customAmount}` : `${currency} ${giveAmount}`}</span>
                </button>
              </form>
            </div>

            {/* Ministry Impact & Privacy Assurance Column */}
            <div className="md:col-span-5 space-y-4">
              
              {/* Impact Metrics Box */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                <h4 className="font-serif-church font-bold text-foreground text-sm">
                  Where Your Seed Goes
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-border">
                    <p className="font-bold text-foreground">📡 Gospel Broadcasts</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Funding low-data streaming & radio across Zimbabwe & Diaspora.
                    </p>
                  </div>
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-border">
                    <p className="font-bold text-foreground">🍲 Widows & Orphans Care</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Monthly grocery hampers distributed to vulnerable families.
                    </p>
                  </div>
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-border">
                    <p className="font-bold text-foreground">🏛️ Cathedral Building Fund</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Phase 2 cathedral development in Belvedere, Harare.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-primary/10 border border-primary/25 rounded-lg text-xs text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[11px]">Official giving receipts generated immediately upon completion.</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 3. SUB-TAB: BOOK 1-ON-1 PASTORAL SERVICE */}
      {subTab === 'booking' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-7 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 text-[10px] font-bold uppercase">
                APOSTOLIC COUNSELING & IMPARTATION
              </span>
              <h3 className="font-serif-church font-bold text-base sm:text-lg text-foreground mt-1.5">
                Book a 1-on-1 Session with Apostle Joe Daniels
              </h3>
              <p className="text-xs text-muted-foreground">
                Available in-person at Cathedral Office or via secure private Zoom / Google Meet.
              </p>
            </div>

            <form onSubmit={handleProcessBooking} className="space-y-3.5">
              
              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Select Ministry Focus
                </label>
                <select
                  value={bookingService}
                  onChange={(e) => setBookingService(e.target.value as any)}
                  className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Prophetic Mentorship">Prophetic Mentorship & Spiritual Direction ($50 Deposit)</option>
                  <option value="Pastoral Counseling">Pastoral Counseling & Family Healing ($30 Deposit)</option>
                  <option value="Business & Estate Dedication">Business & Estate Dedication / Covenant Wealth ($50 Deposit)</option>
                  <option value="Premarital Guidance">Premarital Guidance & Foundation ($30 Deposit)</option>
                  <option value="Deliverance & Healing">Deliverance & Personal Warfare ($30 Deposit)</option>
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Available Time Slot (CAT)
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="10:00 AM CAT">10:00 AM CAT (Morning)</option>
                    <option value="02:00 PM CAT">02:00 PM CAT (Afternoon)</option>
                    <option value="04:30 PM CAT">04:30 PM CAT (Late Afternoon)</option>
                    <option value="08:00 PM CAT">08:00 PM CAT (Diaspora Evening)</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Your Location (Where you are)
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingLocation}
                    onChange={(e) => setBookingLocation(e.target.value)}
                    placeholder="e.g. Harare, London, Bulawayo"
                    className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Brief Prayer or Discussion Background
                </label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Share a short note on what you would like to bring before Apostle Joe Daniels..."
                  className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Submit CTA */}
              {bookingPaymentError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {bookingPaymentError}
                </div>
              )}
              <button
                id="btn-confirm-booking-submit"
                type="submit"
                className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirm Session & Generate Zoom/SMS Link</span>
              </button>

            </form>
          </div>

          {/* Booking Summary / Confirmation View */}
          <div className="md:col-span-5 space-y-4">
            {confirmedBooking ? (
              <div className="bg-card border-2 border-emerald-500/60 rounded-xl p-5 space-y-3 text-center shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-serif-church font-bold text-foreground text-base">
                  1-on-1 Session Confirmed!
                </h4>
                <p className="text-xs text-muted-foreground">
                  Your appointment with <span className="text-primary font-bold">Apostle Joe Daniels</span> has been recorded.
                </p>

                <div className="bg-secondary/60 p-3 rounded-lg border border-border text-left text-xs space-y-1.5">
                  <p><span className="text-muted-foreground">Service:</span> <span className="font-bold text-foreground">{confirmedBooking.service_type}</span></p>
                  <p><span className="text-muted-foreground">Date/Time:</span> {confirmedBooking.date} • {confirmedBooking.time_slot}</p>
                  <p><span className="text-muted-foreground">Status:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">Confirmed</span></p>
                  <p className="pt-1 border-t border-border truncate">
                    <span className="text-muted-foreground">Zoom:</span>{' '}
                    <a href={confirmedBooking.zoom_link} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                      {confirmedBooking.zoom_link}
                    </a>
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={`https://wa.me/${confirmedBooking.reminder_phone.replace(/[^0-9]/g, '')}?text=Shalom%20${encodeURIComponent(confirmedBooking.user_name)},%20your%201-on-1%20prophetic%20session%20with%20Apostle%20Joe%20Daniels%20is%20confirmed%20for%20${confirmedBooking.date}%20at%20${confirmedBooking.time_slot}.%20Zoom%20link:%20${confirmedBooking.zoom_link}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Reminder to WhatsApp</span>
                  </a>

                  <a
                    href={confirmedBooking.zoom_link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-4 h-4 text-primary" />
                    <span>Launch Private Zoom Meeting</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-sm">
                <h4 className="font-serif-church font-bold text-foreground text-sm">
                  Apostolic 1-on-1 Guidelines
                </h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Sessions are conducted strictly in confidence and covered by the blood covenant.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>You will receive an automated WhatsApp reminder and Zoom access code 1 hour before scheduled time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>For international / diaspora partners, times are automatically synced with your local timezone.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. SUB-TAB: STORE (BOOKS, APPAREL, MEDIA) */}
      {subTab === 'store' && (
        <div className="space-y-4">
          
          {/* Cart Header trigger if items exist */}
          {cart.length > 0 && (
            <div className="bg-card border border-border text-foreground p-3.5 rounded-xl flex items-center justify-between font-bold shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground font-bold">Active Cart</span>
                  <span className="text-sm font-bold text-foreground">{totalCartItemCount} item(s) • {getPrice(totalCartUsd)}</span>
                </div>
              </div>
              <button
                id="btn-view-cart-checkout"
                onClick={() => setShowCartModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
              >
                View Cart / Checkout →
              </button>
            </div>
          )}

          {/* JD Collection Official Store Banner */}
          <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-mono font-bold tracking-wider uppercase border border-primary/30">
                    Official Release 2026
                  </span>
                  <span className="text-[11px] text-muted-foreground">• Worldwide Dispatch</span>
                </div>
                <h3 className="font-serif-church text-base sm:text-lg font-bold text-foreground tracking-wide">
                  Joe Daniels Collection & Kingdom Resources
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  Faith-inspired apparel, bestselling prophetic literature, and consecrated media. Wear the message, represent the Kingdom.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-right">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">Collection Pricing</p>
                  <p className="text-xs font-bold text-foreground">$34.99 USD <span className="text-muted-foreground font-normal">|</span> R699 ZAR</p>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border overflow-x-auto no-scrollbar">
              {[
                { id: 'All', label: 'All Items' },
                { id: 'Apparel', label: '👕 Kingdom Apparel (JD Collection)' },
                { id: 'Books', label: '📖 Apostolic Books' },
                { id: 'Media', label: '💿 Anointing Oil & Media' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableProducts
              .filter(p => {
                if (selectedCategory === 'All') return true;
                if (selectedCategory === 'Apparel') return p.category === 'Kingdom Apparel';
                if (selectedCategory === 'Books') return p.category === 'Books';
                if (selectedCategory === 'Media') return p.category === 'Anointing Oil & Media' || p.category === 'Conference Passes';
                return true;
              })
              .map(prod => {
                const isApparel = prod.category === 'Kingdom Apparel';
                const currentSize = selectedSizes[prod.id] || (prod.available_sizes ? prod.available_sizes[1] || prod.available_sizes[0] : 'M');

                return (
                  <div
                    key={prod.id}
                    className="bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden flex flex-col justify-between transition-all shadow-sm group"
                  >
                    <div>
                      {/* Product Image Box */}
                      <div className="relative aspect-square bg-secondary/40 overflow-hidden flex items-center justify-center p-3">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/90 text-[10px] font-bold text-foreground border border-border backdrop-blur-sm">
                          {prod.category}
                        </span>
                        {prod.is_bestseller && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase shadow-sm">
                            Bestseller
                          </span>
                        )}
                        {/* Quick Details Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setRotationY(0);
                            setRotationX(0);
                            setPreviewProduct(prod);
                          }}
                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-background/90 hover:bg-background text-foreground text-[10px] font-bold backdrop-blur-sm border border-border flex items-center gap-1 transition-all shadow-sm"
                          title="View Product Details"
                        >
                          <Eye className="w-3 h-3 text-primary" />
                          <span>Details</span>
                        </button>
                      </div>

                      <div className="p-3.5 space-y-2">
                        {/* Color / Theme Badge */}
                        {prod.color_theme && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold text-primary tracking-wider uppercase truncate">
                              {prod.color_theme}
                            </span>
                          </div>
                        )}

                        <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                          {prod.name}
                        </h4>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>

                        {/* Size Selection for Apparel */}
                        {isApparel && prod.available_sizes && (
                          <div className="pt-1">
                            <p className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Select Size:</p>
                            <div className="flex items-center gap-1.5">
                              {prod.available_sizes.map(size => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setSelectedSizes(prev => ({ ...prev, [prod.id]: size }))}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all border ${
                                    currentSize === size
                                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                      : 'bg-secondary text-foreground border-border hover:border-border/80'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Price Display with exact USD & ZAR prices */}
                        <div className="pt-2 flex items-baseline flex-wrap gap-x-2 gap-y-0.5 border-t border-border">
                          <span className="text-base font-bold text-foreground">
                            {getPrice(prod.price_usd)}
                          </span>
                          {prod.price_zar && (
                            <span className="text-xs font-semibold text-muted-foreground">
                              | R{prod.price_zar}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium">
                            ({prod.price_zig} ZiG)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/30 border-t border-border">
                      <button
                        id={`btn-add-product-${prod.id}`}
                        onClick={() => handleAddToCart(prod, isApparel ? currentSize : undefined)}
                        className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart {isApparel && currentSize ? `(${currentSize})` : ''}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* 5. Printable / Downloadable Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-center">
            
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mx-auto border border-primary/30">
              <Receipt className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                OFFICIAL KINGDOM GIVING RECEIPT
              </span>
              <h3 className="font-serif-church text-lg font-bold text-foreground mt-0.5">
                Gateway Church Zimbabwe
              </h3>
              <p className="text-xs text-muted-foreground">Apostle Joe Daniels Ministry</p>
            </div>

            <div className="bg-secondary/60 rounded-lg p-4 border border-border text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Receipt No:</span>
                <span className="font-bold text-primary">{activeReceipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner:</span>
                <span className="text-foreground">{activeReceipt.donor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fund:</span>
                <span className="text-foreground font-bold">{activeReceipt.fund_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Via:</span>
                <span className="text-foreground">{activeReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impact Allocation:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">{activeReceipt.impact_tag}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 text-sm">
                <span className="text-foreground font-bold">Total Given:</span>
                <span className="text-foreground font-black">{activeReceipt.currency} {activeReceipt.amount}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              "The Lord remember all thine offerings, and accept thy burnt sacrifice. Selah." — Psalm 20:3
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Fixed Kingdom Store Cart & Checkout Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col text-foreground">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-church font-bold text-foreground text-base">
                    Kingdom Store Cart
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {totalCartItemCount} item{totalCartItemCount !== 1 ? 's' : ''} in cart
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-destructive hover:opacity-80 font-semibold px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowCartModal(false)}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cart Content: Empty State or Items List */}
            {cart.length === 0 ? (
              <div className="py-10 text-center space-y-3.5 my-auto">
                <div className="w-16 h-16 rounded-xl bg-secondary border border-border mx-auto flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-base">Your Cart is Currently Empty</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Browse our collection of ministry books, holy communion sets, anointed audio teachings, and apparel.
                  </p>
                </div>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm uppercase tracking-wider transition-transform active:scale-95"
                >
                  Explore Store Items
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Items List */}
                <div className="space-y-2.5">
                  {cart.map((item) => (
                    <div
                      key={`${item.product.id}_${item.selectedSize || 'std'}`}
                      className="p-3 bg-secondary/40 rounded-xl border border-border flex items-center justify-between gap-3 text-xs"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold p-1">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ShoppingBag className="w-5 h-5 opacity-60" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate text-xs">{item.product.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[11px] text-primary font-semibold">{getPrice(item.product.price_usd)} each</p>
                          {item.selectedSize && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/30">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </div>
                        <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground mt-0.5">
                          {item.product.category}
                        </span>
                      </div>

                      {/* Quantity Controls & Line Total */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, -1, item.selectedSize)}
                            className="w-6 h-6 rounded-md bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center text-xs transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-foreground text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, 1, item.selectedSize)}
                            className="w-6 h-6 rounded-md bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center text-xs transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right min-w-[50px]">
                          <span className="font-bold text-foreground text-xs block">
                            {getPrice(item.product.price_usd * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                            className="text-destructive hover:opacity-80 text-[10px] mt-0.5 inline-flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fulfillment & Delivery Selection */}
                <div className="bg-secondary/30 p-3 rounded-xl border border-border space-y-2 text-xs">
                  <span className="block text-[10px] uppercase font-bold text-primary tracking-wider">
                    Fulfillment Method
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        deliveryMethod === 'pickup'
                          ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Cathedral Hub</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Belvedere Hub • FREE</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('courier')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        deliveryMethod === 'courier'
                          ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Express Courier</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Harare & Nationwide • + $3.00</p>
                    </button>
                  </div>

                  {deliveryMethod === 'courier' && (
                    <div className="pt-2 animate-in fade-in">
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                        Delivery Residential / Office Address:
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. 14 Samora Machel Ave, Harare"
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Recipient Details */}
                <div className="bg-secondary/30 p-3 rounded-xl border border-border space-y-2 text-xs">
                  <span className="block text-[10px] uppercase font-bold text-primary tracking-wider">
                    Recipient Contact
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-0.5">Full Name</label>
                      <input
                        type="text"
                        value={orderName}
                        onChange={(e) => setOrderName(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-0.5">Mobile Phone (EcoCash / WhatsApp)</label>
                      <input
                        type="tel"
                        value={orderPhone}
                        onChange={(e) => setOrderPhone(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Gateway Selector */}
                <div className="bg-secondary/30 p-3 rounded-xl border border-border space-y-2 text-xs">
                  <span className="block text-[10px] uppercase font-bold text-primary tracking-wider">
                    Payment Method
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(['EcoCash', 'OneMoney', 'InnBucks', 'Paynow'] as PaymentGateway[]).map(gw => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setOrderPaymentMethod(gw)}
                        className={`p-2 rounded-lg text-center font-bold text-[11px] border transition-all ${
                          orderPaymentMethod === gw
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {gw}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-secondary/50 p-3.5 rounded-xl border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items Subtotal:</span>
                    <span>{getPrice(cartSubtotalUsd)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fulfillment Delivery:</span>
                    <span>{deliveryMethod === 'courier' ? getPrice(deliveryFeeUsd) : 'FREE (Church Pickup)'}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-black text-foreground">
                    <span>Total Amount:</span>
                    <span className="text-foreground text-base">{getPrice(totalCartUsd)}</span>
                  </div>
                </div>

                {/* Confirm Order Button */}
                <button
                  type="button"
                  onClick={handleProcessOrderCheckout}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order • {getPrice(totalCartUsd)} ({orderPaymentMethod})</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Confirmed Order Digital Receipt Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-60 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in zoom-in-95">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-foreground">
            <div className="text-center space-y-1.5 border-b border-border pb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif-church font-bold text-foreground text-base">
                Kingdom Order Confirmed!
              </h3>
              <p className="text-xs text-muted-foreground">
                Your order has been recorded in the Cathedral Fulfillment Desk.
              </p>
            </div>

            <div className="p-3 bg-secondary/50 rounded-lg border border-border space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Ref:</span>
                <span className="text-primary font-bold">{confirmedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="text-foreground">{confirmedOrder.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="text-foreground">{confirmedOrder.user_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fulfillment:</span>
                <span className="text-foreground truncate max-w-[200px]">{confirmedOrder.delivery_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment:</span>
                <span className="text-foreground">{confirmedOrder.payment_method}</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold text-foreground font-sans">
                <span>Total Paid:</span>
                <span>{getPrice(confirmedOrder.total_usd)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Receipt</span>
              </button>
              <button
                onClick={() => setConfirmedOrder(null)}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button for Store Browsing */}
      {subTab === 'store' && cart.length > 0 && !showCartModal && (
        <button
          onClick={() => setShowCartModal(true)}
          className="fixed bottom-20 right-4 sm:right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg font-bold text-xs shadow-lg flex items-center gap-2.5 border border-primary/20 active:scale-95 transition-transform"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart ({totalCartItemCount}) • {getPrice(totalCartUsd)}</span>
        </button>
      )}

      {/* Toast Notification */}
      {cartToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-xs shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 border border-primary/30">
          <CheckCircle2 className="w-4 h-4" />
          <span>{cartToast}</span>
        </div>
      )}

      {/* Product Quick View / Details Modal: Compact 3D Shirt Rotation Float */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl max-w-[340px] w-full p-4 shadow-xl max-h-[88vh] flex flex-col text-foreground overflow-y-auto space-y-3">
            {/* Header: Product Name + X Close Button */}
            <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
              <h3 className="font-serif-church font-bold text-foreground text-sm sm:text-base truncate pr-2">
                {previewProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="w-7 h-7 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3D Rotatable Shirt View */}
            <div 
              className="relative aspect-square max-h-56 w-full bg-secondary/40 rounded-lg overflow-hidden flex items-center justify-center p-3 border border-border cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => {
                setIsDragging3D(true);
                dragStartPos.current = { x: e.clientX, y: e.clientY, initialY: rotationY, initialX: rotationX };
              }}
              onMouseMove={(e) => {
                if (isDragging3D) {
                  const deltaX = e.clientX - dragStartPos.current.x;
                  const deltaY = e.clientY - dragStartPos.current.y;
                  setRotationY((dragStartPos.current.initialY + deltaX * 0.8) % 360);
                  setRotationX(Math.max(-45, Math.min(45, dragStartPos.current.initialX - deltaY * 0.5)));
                }
              }}
              onMouseUp={() => setIsDragging3D(false)}
              onMouseLeave={() => setIsDragging3D(false)}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  setIsDragging3D(true);
                  dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, initialY: rotationY, initialX: rotationX };
                }
              }}
              onTouchMove={(e) => {
                if (isDragging3D && e.touches[0]) {
                  const deltaX = e.touches[0].clientX - dragStartPos.current.x;
                  const deltaY = e.touches[0].clientY - dragStartPos.current.y;
                  setRotationY((dragStartPos.current.initialY + deltaX * 0.8) % 360);
                  setRotationX(Math.max(-45, Math.min(45, dragStartPos.current.initialX - deltaY * 0.5)));
                }
              }}
              onTouchEnd={() => setIsDragging3D(false)}
              onClick={() => {
                if (!isDragging3D) {
                  setRotationY(prev => (prev + 90) % 360);
                }
              }}
              title="Click or drag to rotate 3D"
            >
              {/* Shirt with 3D Perspective Rotation */}
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `perspective(700px) rotateY(${rotationY}deg) rotateX(${rotationX}deg)`,
                  transition: isDragging3D ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <img
                  src={previewProduct.image_url}
                  alt={previewProduct.name}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                  draggable={false}
                />
              </div>

              {/* 3D Interactive Control Overlay */}
              <div className="absolute top-2 right-2 pointer-events-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRotationY(prev => (prev + 90) % 360);
                  }}
                  className="px-2 py-1 rounded-md bg-background/80 hover:bg-background text-[10px] text-primary font-bold border border-border flex items-center gap-1 shadow-sm backdrop-blur-sm"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  <span>Rotate</span>
                </button>
              </div>

              {/* Helper subtle tag */}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-background/80 text-[9px] text-muted-foreground backdrop-blur-sm border border-border">
                Click or drag to rotate 3D
              </span>
            </div>

            {/* Small Size Buttons */}
            {previewProduct.available_sizes && previewProduct.available_sizes.length > 0 && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted-foreground font-semibold">Size:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {previewProduct.available_sizes.map(size => {
                    const chosen = selectedSizes[previewProduct.id] || previewProduct.available_sizes![0];
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSizes(prev => ({ ...prev, [previewProduct.id]: size }))}
                        className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all border ${
                          chosen === size
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                            : 'bg-secondary text-foreground border-border hover:border-border/80'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WhatsApp Icons linking to highlighted phone numbers */}
            <div className="pt-1.5 border-t border-border space-y-1.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                Direct WhatsApp Orders:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { country: 'ZIM', phone: '+263 772 235 795', raw: '263772235795' },
                  { country: 'UK', phone: '+44 7878 760868', raw: '447878760868' },
                  { country: 'USA', phone: '+1 214-412-4864', raw: '12144124864' }
                ].map(line => {
                  const size = previewProduct.available_sizes ? (selectedSizes[previewProduct.id] || previewProduct.available_sizes[0]) : '';
                  const msg = encodeURIComponent(`Hello Gateway Cathedral Dispatch, I would like to order: ${previewProduct.name}${size ? ` (Size: ${size})` : ''} - USD $${previewProduct.price_usd}`);
                  return (
                    <a
                      key={line.country}
                      href={`https://wa.me/${line.raw}?text=${msg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground flex flex-col items-center justify-center text-center transition-all hover:scale-105 group shadow-sm"
                      title={`Order via WhatsApp ${line.country}: ${line.phone}`}
                    >
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{line.country}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{line.phone}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Price & Small Cart Button */}
            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-foreground">
                  {getPrice(previewProduct.price_usd)}
                </span>
                {previewProduct.price_zar && (
                  <span className="text-[10px] text-muted-foreground ml-1">
                    | R{previewProduct.price_zar}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const size = previewProduct.available_sizes ? (selectedSizes[previewProduct.id] || previewProduct.available_sizes[0]) : undefined;
                  handleAddToCart(previewProduct, size);
                  setPreviewProduct(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Moors Betting App Style Instant Online Deposit Modal */}
      <MoorsDepositModal
        isOpen={showMoorsModal}
        onClose={() => setShowMoorsModal(false)}
        onDepositSuccess={(donation) => {
          setShowMoorsModal(false);
          setActiveReceipt(donation);
          if (onDonationSuccess) {
            onDonationSuccess(donation);
          }
        }}
        defaultFund={giveFund}
        initialAmount={customAmount ? parseFloat(customAmount) || 20 : giveAmount}
      />

      {/* 8. Paynow Zimbabwe Credentials Configuration Modal */}
      <PaynowConfigModal
        isOpen={showPaynowConfigModal}
        onClose={() => setShowPaynowConfigModal(false)}
      />

    </div>
  );
};
