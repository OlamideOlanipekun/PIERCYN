import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { processCheckoutPayment, isLivePaymentConfigured } from '../services/paymentService';
import { SHIPPING_CONFIG, getDeliveryFee } from '../utils/shipping';
import { X, ShieldCheck, Lock, Truck, CreditCard, ArrowLeft, AlertCircle } from 'lucide-react';
import { CustomerInfo, OrderItem } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    appliedPromoCode,
    promoDiscountNGN,
    promoDescription,
    isCheckoutOpen,
    setIsCheckoutOpen,
    createOrder,
    showToast,
  } = useShop();

  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: '',
    email: '',
    phone: '',
    state: 'Lagos State',
    city: 'Victoria Island',
    address: '',
    orderNote: '',
  });

  const [shippingMethod, setShippingMethod] = useState<'lagos' | 'nationwide'>('lagos');
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'transfer' | 'paystack'>('transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLiveGateway = isLivePaymentConfigured();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCheckoutOpen) {
        setIsCheckoutOpen(false);
      }
    };
    if (isCheckoutOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCheckoutOpen, setIsCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  // Nigerian States list
  const NIGERIAN_STATES = [
    'Lagos State',
    'Abuja (FCT)',
    'Rivers State',
    'Oyo State',
    'Ogun State',
    'Delta State',
    'Enugu State',
    'Kano State',
    'Kaduna State',
    'Edo State',
    'Anambra State',
    'Kwara State',
    'Other Nigerian State',
  ];

  const deliveryFee = getDeliveryFee(cartSubtotal, shippingMethod);
  const totalNGN = Math.max(0, cartSubtotal + deliveryFee - (promoDiscountNGN || 0));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (!customer.fullName.trim() || !customer.email.trim() || !customer.phone.trim() || !customer.address.trim()) {
      setErrorMessage('Please fill in your full name, email, phone number, and delivery address.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your bag is currently empty. Please add pieces before checkout.');
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      // 1. Authoritative Server-Side Order Creation (Awaited)
      const createdServerOrder = await createOrder({
        customer,
        shippingRegion: shippingMethod,
        paymentMethod: paymentMethodChoice === 'paystack' && isLiveGateway ? 'paystack' : 'transfer',
        items: itemsPayload,
        discountCode: appliedPromoCode || undefined,
      });

      // 2. If Paystack Live Gateway is selected, trigger payment authorization with server order reference
      if (paymentMethodChoice === 'paystack' && isLiveGateway) {
        const paymentRes = await processCheckoutPayment({
          orderNumber: createdServerOrder.orderNumber,
          amountNGN: createdServerOrder.totalNGN,
          customerEmail: customer.email,
          customerName: customer.fullName,
          customerPhone: customer.phone,
        });

        if (!paymentRes.success) {
          setErrorMessage(paymentRes.message || 'Payment could not be completed. Your reservation is held; you can complete bank transfer or WhatsApp confirmation.');
          setIsSubmitting(false);
          setIsCheckoutOpen(false);
          window.history.pushState({}, '', `/order/success/${createdServerOrder.id}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }
      }

      setIsSubmitting(false);
      setIsCheckoutOpen(false);
      window.history.pushState({}, '', `/order/success/${createdServerOrder.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      showToast('Order confirmed by PIERCYN Atelier!');
    } catch (err: any) {
      console.error('[CHECKOUT_SUBMIT_ERROR]', err);
      const rawMsg = err?.message || '';
      let userMsg = 'Sorry, we couldn\'t complete your order. Please check your details and try again.';
      if (
        rawMsg.toLowerCase().includes('insufficient') ||
        rawMsg.toLowerCase().includes('stock') ||
        rawMsg.toLowerCase().includes('sold out') ||
        rawMsg.toLowerCase().includes('variant')
      ) {
        userMsg = rawMsg;
      } else if (rawMsg.length > 5 && rawMsg.length < 150 && !rawMsg.includes('{') && !rawMsg.includes('at ')) {
        userMsg = rawMsg;
      }
      setErrorMessage(userMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto font-sans" role="dialog" aria-modal="true">
      <div className="bg-[#F2F0EB] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-[#DAD8D1] my-6 text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-[#141414] text-[#F2F0EB] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#E8E6E1]" />
            <div>
              <h2 className="font-editorial italic text-xl sm:text-2xl font-normal">CHECKOUT</h2>
              <p className="text-[10px] font-mono text-[#E8E6E1]/70 uppercase tracking-widest">
                DIRECT DOORSTEP DELIVERY
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#F2F0EB] transition-colors cursor-pointer"
            aria-label="Close Checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-700 px-4 py-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM BODY */}
        <form onSubmit={handleSubmitCheckout} className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: CUSTOMER & DELIVERY INFO */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]/80 pb-2 border-b border-[#DAD8D1]">
                1. CONTACT & DELIVERY DETAILS
              </h3>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#141414]/70 mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Tunde Balogun"
                  value={customer.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-[#E8E6E1]/60 border border-[#DAD8D1] rounded-lg px-3 py-2 text-xs text-[#141414] focus:outline-hidden focus:border-[#141414]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#141414]/70 mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="tunde@example.com"
                    value={customer.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#E8E6E1]/60 border border-[#DAD8D1] rounded-lg px-3 py-2 text-xs text-[#141414] focus:outline-hidden focus:border-[#141414]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#141414]/70 mb-1">
                    PHONE / WHATSAPP *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="0801 234 5678"
                    value={customer.phone}
                    onChange={handleInputChange}
                    className="w-full bg-[#E8E6E1]/60 border border-[#DAD8D1] rounded-lg px-3 py-2 text-xs text-[#141414] focus:outline-hidden focus:border-[#141414]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#141414]/70 mb-1">
                    STATE *
                  </label>
                  <select
                    name="state"
                    value={customer.state}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (e.target.value === 'Lagos State') {
                        setShippingMethod('lagos');
                      } else {
                        setShippingMethod('nationwide');
                      }
                    }}
                    className="w-full bg-[#E8E6E1]/60 border border-[#DAD8D1] rounded-lg px-3 py-2 text-xs text-[#141414] focus:outline-hidden focus:border-[#141414]"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#141414]/70 mb-1">
                    CITY / AREA *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="e.g. Lekki Phase 1 / Ikeja"
                    value={customer.city}
                    onChange={handleInputChange}
                    className="w-full bg-[#E8E6E1]/60 border border-[#DAD8D1] rounded-lg px-3 py-2 text-xs text-[#141414] focus:outline-hidden focus:border-[#141414]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#141414]/70 mb-1">
                  STREET DELIVERY ADDRESS *
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  placeholder="Street name, apartment, landmark"
                  value={customer.address}
                  onChange={handleInputChange}
                  className="w-full bg-[#E8E6E1]/60 border border-[#DAD8D1] rounded-lg px-3 py-2 text-xs text-[#141414] focus:outline-hidden focus:border-[#141414]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#141414]/70 mb-1">
                  ORDER NOTE (OPTIONAL)
                </label>
                <input
                  type="text"
                  name="orderNote"
                  placeholder="Special instructions for the courier"
                  value={customer.orderNote}
                  onChange={handleInputChange}
                  className="w-full bg-[#E8E6E1]/60 border border-[#DAD8D1] rounded-lg px-3 py-2 text-xs text-[#141414] focus:outline-hidden focus:border-[#141414]"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: SHIPPING METHOD, PAYMENT & ORDER SUMMARY */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]/80 pb-2 border-b border-[#DAD8D1] mb-3">
                  2. DELIVERY METHOD
                </h3>

                <div className="space-y-2">
                  <label
                    onClick={() => setShippingMethod('lagos')}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      shippingMethod === 'lagos'
                        ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                        : 'bg-[#E8E6E1]/60 text-[#141414] border-[#DAD8D1]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-bold uppercase">LAGOS DOORSTEP</p>
                        <p className="text-[10px] opacity-75">{SHIPPING_CONFIG.lagosTimeframe}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">
                      {cartSubtotal >= SHIPPING_CONFIG.freeShippingThresholdNGN
                        ? 'FREE'
                        : `₦${SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()}`}
                    </span>
                  </label>

                  <label
                    onClick={() => setShippingMethod('nationwide')}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      shippingMethod === 'nationwide'
                        ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                        : 'bg-[#E8E6E1]/60 text-[#141414] border-[#DAD8D1]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-bold uppercase">NATIONWIDE DELIVERY</p>
                        <p className="text-[10px] opacity-75">{SHIPPING_CONFIG.nationwideTimeframe}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">
                      {cartSubtotal >= SHIPPING_CONFIG.freeShippingThresholdNGN
                        ? 'FREE'
                        : `₦${SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()}`}
                    </span>
                  </label>
                </div>

                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]/80 pb-2 border-b border-[#DAD8D1] my-3">
                  3. PAYMENT SELECTION
                </h3>

                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethodChoice('transfer')}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      paymentMethodChoice === 'transfer'
                        ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                        : 'bg-[#E8E6E1]/60 text-[#141414] border-[#DAD8D1]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-bold uppercase">BANK TRANSFER / WHATSAPP</p>
                        <p className="text-[10px] opacity-75">Instant reservation + bank transfer receipt</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-700/20 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      RECOMMENDED
                    </span>
                  </label>

                  {isLiveGateway && (
                    <label
                      onClick={() => setPaymentMethodChoice('paystack')}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        paymentMethodChoice === 'paystack'
                          ? 'bg-[#141414] text-[#F2F0EB] border-[#141414]'
                          : 'bg-[#E8E6E1]/60 text-[#141414] border-[#DAD8D1]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4" />
                        <div>
                          <p className="text-xs font-bold uppercase">PAYSTACK DEBIT CARD</p>
                          <p className="text-[10px] opacity-75">Mastercard, Visa, Verve</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* SUMMARY BREAKDOWN */}
              <div className="bg-[#E8E6E1] p-3.5 rounded-xl border border-[#DAD8D1] space-y-2 text-xs font-sans mt-4">
                <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#141414]/70 mb-2 pb-1 border-b border-[#DAD8D1]">
                  ORDER SUMMARY ({cart.length} {cart.length === 1 ? 'PIECE' : 'PIECES'})
                </h4>
                <div className="flex justify-between text-[#141414]/80">
                  <span>Subtotal</span>
                  <span className="font-mono">₦{cartSubtotal.toLocaleString()}</span>
                </div>
                {promoDiscountNGN > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Discount ({appliedPromoCode})</span>
                    <span className="font-mono">-₦{promoDiscountNGN.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#141414]/80">
                  <span>Delivery Fee</span>
                  <span className="font-mono">
                    {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#141414] pt-2 border-t border-[#DAD8D1]">
                  <span>Total Amount</span>
                  <span className="font-mono text-base">₦{totalNGN.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 min-h-[48px] bg-[#141414] text-[#F2F0EB] rounded-full text-xs uppercase tracking-widest font-bold hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-pulse">PROCESSING ORDER...</span>
                  ) : (
                    <span>CONFIRM & PLACE ORDER (₦{totalNGN.toLocaleString()})</span>
                  )}
                </button>
              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
};
