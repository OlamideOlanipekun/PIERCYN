import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { processCheckoutPayment } from '../services/paymentService';
import { X, ShieldCheck, Lock, Truck, CreditCard, ArrowLeft } from 'lucide-react';
import { CustomerInfo, OrderItem } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    createOrder,
    setIsOrderConfirmedOpen,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const deliveryFee =
    cartSubtotal >= 35000
      ? 0
      : shippingMethod === 'lagos'
      ? 2500
      : 4500;

  const totalNGN = cartSubtotal + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customer.fullName || !customer.email || !customer.phone || !customer.address) {
      setErrorMessage('Please fill in all required delivery details.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Initialize Payment via Payment Provider Abstraction
      const paymentResult = await processCheckoutPayment({
        orderNumber: `PCY-TEMP-${Date.now()}`,
        amountNGN: totalNGN,
        customerEmail: customer.email,
        customerName: customer.fullName,
        customerPhone: customer.phone,
      });

      if (!paymentResult.success) {
        setErrorMessage(paymentResult.message || "Your payment didn't go through. Please try again or use another payment method.");
        setIsSubmitting(false);
        return;
      }

      // Step 2: Map cart items to OrderItems
      const orderItems: OrderItem[] = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        color: item.selectedColor,
        size: item.selectedSize,
        quantity: item.quantity,
        unitPriceNGN: item.product.priceNGN,
        totalPriceNGN: item.product.priceNGN * item.quantity,
        image: item.product.images[0],
      }));

      // Step 3: Create persistent Order
      createOrder({
        customer,
        items: orderItems,
        subtotalNGN: cartSubtotal,
        deliveryFeeNGN: deliveryFee,
        totalNGN,
        shippingMethod: shippingMethod === 'lagos' ? 'Lagos Express Doorstep (24-48h)' : 'Standard Nationwide Nigeria (2-4 Days)',
        paymentMethod: 'PIERCYN Direct Secure Gateway',
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
      });

      setIsSubmitting(false);
      setIsCheckoutOpen(false);
      setIsOrderConfirmedOpen(true);
      showToast('Order confirmed successfully!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-[#F2F0EB] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-[#DAD8D1] my-8 text-left">
        {/* MODAL HEADER */}
        <div className="bg-[#141414] text-[#F2F0EB] p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#E8E6E1]" />
            <div>
              <h2 className="font-editorial italic text-xl sm:text-2xl">CHECKOUT</h2>
              <p className="text-[10px] font-mono text-[#E8E6E1]/70 uppercase tracking-widest">
                DIRECT DOORSTEP DELIVERY
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="bg-red-900/10 border-b border-red-500/30 p-3 px-6 text-red-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitCheckout} className="p-4 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT COLUMN: CUSTOMER & DELIVERY INFO */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]/80 pb-2 border-b border-[#DAD8D1]">
                1. YOUR DETAILS & ADDRESS
              </h3>

              <div>
                <label className="text-[11px] font-semibold uppercase text-[#141414]/70 block mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={customer.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Babatunde Ogunlesi"
                  className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#141414]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-[#141414]/70 block mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={customer.email}
                    onChange={handleInputChange}
                    placeholder="name@domain.com"
                    className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#141414]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase text-[#141414]/70 block mb-1">
                    PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={customer.phone}
                    onChange={handleInputChange}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-[#141414]/70 block mb-1">
                    STATE *
                  </label>
                  <select
                    name="state"
                    value={customer.state}
                    onChange={handleInputChange}
                    className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#141414] cursor-pointer"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase text-[#141414]/70 block mb-1">
                    CITY / AREA *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={customer.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Lekki Phase 1 / Ikeja"
                    className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-[#141414]/70 block mb-1">
                  STREET DELIVERY ADDRESS *
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={customer.address}
                  onChange={handleInputChange}
                  placeholder="Full street name, building number, apartment details..."
                  className="w-full bg-[#E8E6E1] border border-[#DAD8D1] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: SHIPPING METHOD & ORDER SUMMARY */}
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
                        <p className="text-[10px] opacity-75">Express 24-48 Hours</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">
                      {cartSubtotal >= 35000 ? 'FREE' : '₦2,500'}
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
                        <p className="text-xs font-bold uppercase">NATIONWIDE NIGERIA</p>
                        <p className="text-[10px] opacity-75">Standard 2–4 Business Days</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">
                      {cartSubtotal >= 35000 ? 'FREE' : '₦4,500'}
                    </span>
                  </label>
                </div>
              </div>

              {/* ORDER BREAKDOWN */}
              <div className="bg-[#E8E6E1] p-4 rounded-xl space-y-2 text-xs border border-[#DAD8D1]">
                <h4 className="font-mono font-bold uppercase text-[#141414]/70 mb-2 pb-1 border-b border-[#DAD8D1]">
                  ORDER SUMMARY ({cart.length} {cart.length === 1 ? 'PIECE' : 'PIECES'})
                </h4>
                <div className="flex justify-between text-[#141414]/80">
                  <span>Subtotal</span>
                  <span className="font-mono">₦{cartSubtotal.toLocaleString()}</span>
                </div>
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

              {/* ACTION BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <span>PLACING ORDER...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>PLACE ORDER (₦{totalNGN.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
