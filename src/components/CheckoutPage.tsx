import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { processCheckoutPayment, isLivePaymentConfigured } from '../services/paymentService';
import { SHIPPING_CONFIG, getDeliveryFee } from '../utils/shipping';
import { ActivePageView, CustomerInfo } from '../types';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  MessageCircle,
  Building2
} from 'lucide-react';

interface CheckoutPageProps {
  onSelectPage: (page: ActivePageView) => void;
  onViewProduct?: (product: any) => void;
}

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

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onSelectPage, onViewProduct }) => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    appliedPromoCode,
    promoDiscountNGN,
    promoDescription,
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

  const [whatsAppDifferent, setWhatsAppDifferent] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'lagos' | 'nationwide'>('lagos');
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'transfer' | 'paystack'>('transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLiveGateway = isLivePaymentConfigured();
  const deliveryFee = getDeliveryFee(cartSubtotal, shippingMethod);
  const totalNGN = Math.max(0, cartSubtotal + deliveryFee - (promoDiscountNGN || 0));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (
      !customer.fullName.trim() ||
      !customer.email.trim() ||
      !customer.phone.trim() ||
      !customer.address.trim()
    ) {
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

      const finalNote = whatsAppDifferent && whatsAppNumber.trim()
        ? `${customer.orderNote || ''} [WhatsApp: ${whatsAppNumber.trim()}]`.trim()
        : customer.orderNote;

      // Authoritative Server-Side Order Creation
      const createdServerOrder = await createOrder({
        customer: { ...customer, orderNote: finalNote },
        shippingRegion: shippingMethod,
        paymentMethod: paymentMethodChoice === 'paystack' && isLiveGateway ? 'paystack' : 'transfer',
        items: itemsPayload,
        discountCode: appliedPromoCode || undefined,
      });

      // If Paystack Live Gateway is selected, trigger payment authorization
      if (paymentMethodChoice === 'paystack' && isLiveGateway) {
        const paymentRes = await processCheckoutPayment({
          orderNumber: createdServerOrder.orderNumber,
          amountNGN: totalNGN,
          customerEmail: customer.email,
          customerName: customer.fullName,
          customerPhone: customer.phone,
        });

        if (!paymentRes.success) {
          setErrorMessage(
            paymentRes.message ||
              'Payment could not be completed. Your order reservation is held; you can complete bank transfer or WhatsApp confirmation.'
          );
          setIsSubmitting(false);
          window.history.pushState({}, '', `/order-confirmation?orderId=${createdServerOrder.id}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }
      }

      setIsSubmitting(false);
      showToast('Order confirmed by PIERCYN Atelier!');
      window.history.pushState({}, '', `/order-confirmation?orderId=${createdServerOrder.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err: any) {
      console.error('[CHECKOUT_SUBMIT_ERROR]', err);
      const rawMsg = err?.message || '';
      let userMsg = "Sorry, we couldn't complete your order. Please check your details and try again.";
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

  if (cart.length === 0) {
    return (
      <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-[75vh] pt-28 sm:pt-36 pb-20 font-sans">
        <div className="piercyn-container max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#E5E0D5] text-[#141414] flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-7 h-7 stroke-[1.5]" />
          </div>
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[#7A7771] block mb-2 font-semibold">
            CHECKOUT
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl italic text-[#141414] mb-4">
            No Pieces in Bag
          </h1>
          <p className="text-[14px] text-[#55524D] leading-relaxed mb-8">
            Please add your preferred pieces to the shopping bag before proceeding to checkout.
          </p>
          <button
            onClick={() => onSelectPage('shop')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-[0.18em] hover:bg-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>GO TO SHOP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-24 font-sans">
      <div className="piercyn-container max-w-5xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-6">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <button onClick={() => onSelectPage('cart')} className="hover:text-[#141414] cursor-pointer">
            BAG ({cartCount})
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">GUEST CHECKOUT</span>
        </nav>

        {/* Page Header */}
        <header className="border-b border-[#DAD8D1] pb-6 mb-8">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] mb-1 font-semibold">
            <Lock className="w-3 h-3 text-[#141414]" />
            <span>ENCRYPTED & DIRECT TO ATELIER</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl italic text-[#141414]">
            Checkout
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#55524D]">
            Guest checkout · Fast, secure dispatch directly to your doorstep.
          </p>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <strong className="font-semibold block uppercase font-mono tracking-wider">Order could not be submitted</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Main Grid: Form (Col 7) + Summary (Col 5) */}
        <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: Customer Details & Options (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Contact Information */}
            <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-5 sm:p-7">
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1 font-semibold">
                STEP 01
              </span>
              <h2 className="font-editorial text-2xl italic text-[#141414] mb-4">
                Customer & Contact
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={customer.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Tunde Adebayo"
                    className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={customer.email}
                      onChange={handleInputChange}
                      placeholder="tunde@example.com"
                      className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={customer.phone}
                      onChange={handleInputChange}
                      placeholder="0801 234 5678"
                      className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                {/* Optional WhatsApp Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#55524D]">
                    <input
                      type="checkbox"
                      checked={whatsAppDifferent}
                      onChange={(e) => setWhatsAppDifferent(e.target.checked)}
                      className="rounded border-[#DAD6CC] text-[#141414] focus:ring-0"
                    />
                    <span>My WhatsApp contact is different from my phone number</span>
                  </label>
                  {whatsAppDifferent && (
                    <div className="mt-2">
                      <input
                        type="tel"
                        value={whatsAppNumber}
                        onChange={(e) => setWhatsAppNumber(e.target.value)}
                        placeholder="WhatsApp Number (e.g. 0812 345 6789)"
                        className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Delivery Destination */}
            <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-5 sm:p-7">
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1 font-semibold">
                STEP 02
              </span>
              <h2 className="font-editorial text-2xl italic text-[#141414] mb-4">
                Delivery Address
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                    Street Address & Apartment / Landmark *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={customer.address}
                    onChange={handleInputChange}
                    placeholder="e.g. 14 Adeola Odeku St, Flat 3B"
                    className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                      City / Area *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={customer.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Victoria Island / Lekki / Ikeja"
                      className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                      State *
                    </label>
                    <select
                      name="state"
                      value={customer.state}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (e.target.value.toLowerCase().includes('lagos')) {
                          setShippingMethod('lagos');
                        } else {
                          setShippingMethod('nationwide');
                        }
                      }}
                      className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Option Selector */}
                <div className="pt-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-2 font-semibold">
                    Shipping Region & Speed
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        shippingMethod === 'lagos'
                          ? 'border-[#141414] bg-white/80 ring-1 ring-[#141414]'
                          : 'border-[#DAD6CC] bg-white/30 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="shippingRegion"
                          value="lagos"
                          checked={shippingMethod === 'lagos'}
                          onChange={() => setShippingMethod('lagos')}
                          className="mt-0.5 text-[#141414]"
                        />
                        <div>
                          <strong className="block text-xs font-bold text-[#141414]">Lagos Doorstep</strong>
                          <span className="text-[11px] text-[#6E6B65]">{SHIPPING_CONFIG.lagosTimeframe}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs mt-2 text-right">
                        ₦{SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()}
                      </span>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        shippingMethod === 'nationwide'
                          ? 'border-[#141414] bg-white/80 ring-1 ring-[#141414]'
                          : 'border-[#DAD6CC] bg-white/30 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="shippingRegion"
                          value="nationwide"
                          checked={shippingMethod === 'nationwide'}
                          onChange={() => setShippingMethod('nationwide')}
                          className="mt-0.5 text-[#141414]"
                        />
                        <div>
                          <strong className="block text-xs font-bold text-[#141414]">Nationwide Nigeria</strong>
                          <span className="text-[11px] text-[#6E6B65]">{SHIPPING_CONFIG.nationwideTimeframe}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs mt-2 text-right">
                        ₦{SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A7771] mb-1 font-semibold">
                    Delivery Instructions / Order Note (Optional)
                  </label>
                  <textarea
                    name="orderNote"
                    rows={2}
                    value={customer.orderNote || ''}
                    onChange={handleInputChange}
                    placeholder="Gate code, specific building details, or delivery preferences..."
                    className="w-full bg-white/70 border border-[#DAD6CC] rounded-lg px-3.5 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-5 sm:p-7">
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1 font-semibold">
                STEP 03
              </span>
              <h2 className="font-editorial text-2xl italic text-[#141414] mb-4">
                Payment Option
              </h2>

              <div className="space-y-3">
                {/* Bank Transfer / WhatsApp Option */}
                <label
                  className={`p-4 rounded-xl border block cursor-pointer transition-all ${
                    paymentMethodChoice === 'transfer'
                      ? 'border-[#141414] bg-white/90 ring-1 ring-[#141414]'
                      : 'border-[#DAD6CC] bg-white/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transfer"
                      checked={paymentMethodChoice === 'transfer'}
                      onChange={() => setPaymentMethodChoice('transfer')}
                      className="mt-0.5 text-[#141414]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-[#141414]">Direct Bank Transfer / WhatsApp</strong>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[9px] font-mono font-bold uppercase">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[#55524D] mt-1 leading-relaxed">
                        Reserve your pieces instantly. You'll receive our verified Lagos business account details on the confirmation page and via WhatsApp to complete payment.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Paystack Online Gateway */}
                <label
                  className={`p-4 rounded-xl border block cursor-pointer transition-all ${
                    paymentMethodChoice === 'paystack'
                      ? 'border-[#141414] bg-white/90 ring-1 ring-[#141414]'
                      : 'border-[#DAD6CC] bg-white/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={paymentMethodChoice === 'paystack'}
                      onChange={() => setPaymentMethodChoice('paystack')}
                      className="mt-0.5 text-[#141414]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-[#141414]">Debit Card / Paystack Online</strong>
                        <CreditCard className="w-3.5 h-3.5 text-[#7A7771]" />
                      </div>
                      <p className="text-[11.5px] text-[#55524D] mt-1 leading-relaxed">
                        Pay securely with Mastercard, Visa, Verve, Bank Transfer, or USSD via Paystack.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT: Order Summary & Place Order (Col 5) */}
          <div className="lg:col-span-5 bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6 sm:p-7 sticky top-24">
            <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#7A7771] block mb-1 font-semibold">
              BAG OVERVIEW
            </span>
            <h2 className="font-editorial text-2xl italic text-[#141414] mb-4">
              Your Selection ({cartCount})
            </h2>

            {/* Mini Items List */}
            <div className="divide-y divide-[#DAD6CC] max-h-60 overflow-y-auto mb-5 pr-1">
              {cart.map((item) => (
                <div
                  key={`${item.variantId}-${item.selectedColor}-${item.selectedSize}`}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img
                      src={item.product.images?.[0] || ''}
                      alt={item.product.name}
                      className="w-10 h-12 object-cover rounded bg-[#D7D2C5] shrink-0"
                    />
                    <div className="truncate">
                      <strong className="block truncate text-[#141414] uppercase">{item.product.name}</strong>
                      <span className="text-[11px] text-[#7A7771]">
                        {item.selectedSize} · {item.selectedColor} × {item.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#141414] shrink-0">
                    ₦{(item.product.priceNGN * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary Breakdown */}
            <div className="space-y-2.5 text-xs text-[#55524D] border-t border-[#DAD6CC] pt-4 mb-5 font-sans">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold text-[#141414]">₦{cartSubtotal.toLocaleString()}</span>
              </div>

              {promoDiscountNGN > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Promotion Discount ({appliedPromoCode})</span>
                  <span className="font-mono font-bold">-₦{promoDiscountNGN.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Charge</span>
                <span className="font-mono font-bold text-[#141414]">
                  {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
                </span>
              </div>

              <div className="border-t border-[#DAD6CC] pt-3 flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#141414] uppercase tracking-wider">Total Amount</span>
                <span className="font-mono text-2xl font-bold text-[#141414]">₦{totalNGN.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="checkout-submit-order-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>CREATING SECURE ORDER…</span>
              ) : (
                <>
                  <span>CONFIRM ORDER (₦{totalNGN.toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Guarantees */}
            <div className="mt-6 pt-5 border-t border-[#DAD6CC] space-y-2 text-[11px] text-[#6E6B65]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Instant order confirmation and inventory reservation</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#141414] shrink-0" />
                <span>No hidden fees · Verified courier dispatch from Lagos</span>
              </div>
            </div>

          </div>

        </form>

      </div>
    </main>
  );
};
