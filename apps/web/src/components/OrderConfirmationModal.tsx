import React, { useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { CheckCircle2, MessageCircle, ArrowRight, Copy, Clock, ShieldCheck } from 'lucide-react';

export const OrderConfirmationModal: React.FC = () => {
  const {
    lastCreatedOrder,
    isOrderConfirmedOpen,
    setIsOrderConfirmedOpen,
    showToast,
  } = useShop();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOrderConfirmedOpen) {
        setIsOrderConfirmedOpen(false);
      }
    };
    if (isOrderConfirmedOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOrderConfirmedOpen, setIsOrderConfirmedOpen]);

  if (!isOrderConfirmedOpen || !lastCreatedOrder) return null;

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(lastCreatedOrder.orderNumber);
    showToast(`Copied ${lastCreatedOrder.orderNumber} to clipboard`);
  };

  const isTransfer = lastCreatedOrder.paymentMethod.toLowerCase().includes('transfer') || lastCreatedOrder.paymentStatus === 'PENDING';

  const whatsappMessage = encodeURIComponent(
    `Hello PIERCYN! I just placed Order #${lastCreatedOrder.orderNumber} for ₦${lastCreatedOrder.totalNGN.toLocaleString()}. ${
      isTransfer ? 'I would like to confirm my payment / dispatch details.' : 'Could you confirm dispatch timeframe?'
    }`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto font-sans" role="dialog" aria-modal="true">
      <div className="bg-[#F2F0EB] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-[#DAD8D1] p-5 sm:p-7 text-center text-[#141414] animate-in fade-in zoom-in-95 duration-200">
        
        {/* SUCCESS ICON */}
        <div className="w-14 h-14 bg-[#141414] text-[#F2F0EB] rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
          {isTransfer ? (
            <Clock className="w-7 h-7 text-[#E8E6E1]" />
          ) : (
            <CheckCircle2 className="w-7 h-7 text-[#E8E6E1]" />
          )}
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#141414]/60 block mb-1">
          {isTransfer ? 'ORDER RESERVED' : 'ORDER CONFIRMED'}
        </span>

        <h2 className="font-editorial italic text-2xl sm:text-3xl text-[#141414] font-normal mb-1">
          THANK YOU
        </h2>

        <p className="text-xs text-[#141414]/80 mb-5 font-sans">
          {isTransfer
            ? 'Your pieces are reserved. Please complete your bank transfer below or confirm via WhatsApp.'
            : 'Your order has been received and is being prepared for dispatch.'}
        </p>

        {/* ORDER REFERENCE PILL */}
        <div className="bg-[#E8E6E1] p-3.5 rounded-xl border border-[#DAD8D1] mb-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[9px] font-mono text-[#141414]/60 uppercase block">ORDER REFERENCE</span>
            <span className="text-sm sm:text-base font-mono font-bold text-[#141414]">#{lastCreatedOrder.orderNumber}</span>
          </div>
          <button
            onClick={handleCopyOrderNumber}
            className="px-3 py-1.5 bg-[#141414]/10 hover:bg-[#141414]/20 rounded-md text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>COPY</span>
          </button>
        </div>

        {/* BANK TRANSFER DETAILS (If transfer) */}
        {isTransfer && (
          <div className="bg-[#141414] text-[#F2F0EB] p-4 rounded-xl text-left text-xs mb-4 space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-[#A48B71] text-[10px] uppercase tracking-wider font-bold mb-1">
              <span>PIERCYN OFFICIAL ATELIER ACCOUNT</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Bank:</span>
              <span className="font-semibold text-white">Providus Bank / GTBank</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Account Name:</span>
              <span className="font-semibold text-white">PIERCYN CLOTHING ATELIER</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Account Number:</span>
              <span className="font-bold text-[#F2F0EB]">1029384756</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/20 text-white/80">
              <span>Amount to Transfer:</span>
              <span className="font-bold text-white">₦{lastCreatedOrder.totalNGN.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* SUMMARY BREAKDOWN */}
        <div className="space-y-2 text-left text-xs bg-[#E8E6E1]/60 p-3.5 rounded-xl border border-[#DAD8D1]/60 mb-5 font-sans">
          <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-1.5">
            <span className="text-[#141414]/70">Recipient</span>
            <span className="font-semibold">{lastCreatedOrder.customer.fullName}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-1.5">
            <span className="text-[#141414]/70">Delivery Address</span>
            <span className="font-semibold truncate max-w-[200px]">{lastCreatedOrder.customer.address}, {lastCreatedOrder.customer.state}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#141414]/70">Total Order Amount</span>
            <span className="font-mono font-bold text-sm">₦{lastCreatedOrder.totalNGN.toLocaleString()}</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-2.5">
          <a
            href={`https://wa.me/2348076431059?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>CONFIRM ON WHATSAPP</span>
          </a>

          <button
            onClick={() => setIsOrderConfirmedOpen(false)}
            className="w-full py-3 px-4 bg-[#141414] text-[#F2F0EB] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>CONTINUE SHOPPING</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
