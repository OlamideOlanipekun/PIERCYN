import React from 'react';
import { useShop } from '../context/ShopContext';
import { CheckCircle2, MessageCircle, ArrowRight, Package, Truck, Copy } from 'lucide-react';

export const OrderConfirmationModal: React.FC = () => {
  const {
    lastCreatedOrder,
    isOrderConfirmedOpen,
    setIsOrderConfirmedOpen,
    showToast,
  } = useShop();

  if (!isOrderConfirmedOpen || !lastCreatedOrder) return null;

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(lastCreatedOrder.orderNumber);
    showToast(`Copied ${lastCreatedOrder.orderNumber} to clipboard`);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello PIERCYN Concierge! I just placed Order #${lastCreatedOrder.orderNumber} for ₦${lastCreatedOrder.totalNGN.toLocaleString()}. Could you confirm my dispatch details?`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-[#F2F0EB] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-[#DAD8D1] p-6 sm:p-8 text-center text-[#141414]">
        {/* SUCCESS ICON */}
        <div className="w-16 h-16 bg-[#141414] text-[#F2F0EB] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle2 className="w-8 h-8 text-[#E8E6E1]" />
        </div>

        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#141414]/60 block mb-1">
          ORDER PLACED
        </span>

        <h2 className="font-editorial italic text-3xl sm:text-4xl text-[#141414] font-medium mb-2">
          THANK YOU
        </h2>

        <p className="text-xs text-[#141414]/80 mb-6 font-sans">
          Your order has been received and is being prepared for delivery.
        </p>

        {/* ORDER REFERENCE PILL */}
        <div className="bg-[#E8E6E1] p-4 rounded-xl border border-[#DAD8D1] mb-6 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-mono text-[#141414]/60 uppercase block">ORDER REFERENCE</span>
            <span className="text-base font-mono font-bold text-[#141414]">#{lastCreatedOrder.orderNumber}</span>
          </div>
          <button
            onClick={handleCopyOrderNumber}
            className="p-2 bg-[#141414]/10 hover:bg-[#141414]/20 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>COPY</span>
          </button>
        </div>

        {/* SUMMARY BREAKDOWN */}
        <div className="space-y-3 text-left text-xs bg-[#E8E6E1]/50 p-4 rounded-xl border border-[#DAD8D1]/60 mb-6">
          <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-2">
            <span className="text-[#141414]/70">Recipient</span>
            <span className="font-semibold">{lastCreatedOrder.customer.fullName}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-2">
            <span className="text-[#141414]/70">Delivery Address</span>
            <span className="font-semibold truncate max-w-[200px]">{lastCreatedOrder.customer.address}, {lastCreatedOrder.customer.state}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#141414]/70">Total Paid</span>
            <span className="font-mono font-bold text-sm">₦{lastCreatedOrder.totalNGN.toLocaleString()}</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3">
          <a
            href={`https://wa.me/2348000000000?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>CHAT WITH US ON WHATSAPP</span>
          </a>

          <button
            onClick={() => setIsOrderConfirmedOpen(false)}
            className="w-full py-3.5 px-4 bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>CONTINUE SHOPPING</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
