import React, { useState } from 'react';
import {
  AffiliateNotification,
  formatDateTime,
  AffiliateDashboardTab,
} from '../../types';
import {
  Bell,
  CheckCircle2,
  Clock,
  Wallet,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Check,
} from 'lucide-react';

interface NotificationsViewProps {
  notifications: AffiliateNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onNavigateTab: (tab: AffiliateDashboardTab) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const getIcon = (type: AffiliateNotification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-[#141414]" />;
      case 'commission':
        return <CheckCircle2 className="w-4 h-4 text-[#141414]" />;
      case 'payout':
        return <Wallet className="w-4 h-4 text-[#141414]" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-[#141414]" />;
      default:
        return <Bell className="w-4 h-4 text-[#141414]" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-up max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Activity Alerts
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            Notification Center
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Real-time updates regarding order attribution, clearances, payouts, and announcements.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setFilter(filter === 'ALL' ? 'UNREAD' : 'ALL')}
            className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F2F0EB] border border-[#E5E2DC] text-xs font-semibold uppercase tracking-wider text-[#141414] transition-all cursor-pointer"
          >
            {filter === 'ALL' ? 'Show Unread Only' : 'Show All'}
          </button>
          <button
            onClick={onMarkAllAsRead}
            className="px-4 py-2 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-[#E5E2DC] shadow-sm divide-y divide-[#E5E2DC]">
        {filtered.length === 0 ? (
          <div className="p-16 text-center space-y-2 text-[#737373] text-xs">
            <Bell className="w-8 h-8 text-[#A3A3A3] mx-auto mb-2" />
            <h4 className="font-serif text-base text-[#141414]">
              {filter === 'UNREAD' ? 'No Unread Notifications' : 'No Notifications'}
            </h4>
            <p>You are completely up to date with your creator activity.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 sm:p-6 transition-colors flex items-start gap-4 ${
                !item.isRead ? 'bg-[#FAF8F5]/80' : 'hover:bg-[#FAF8F5]/40'
              }`}
            >
              <div className="w-9 h-9 bg-white border border-[#E5E2DC] flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif font-medium text-sm text-[#141414]">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-[#737373] shrink-0">
                    {formatDateTime(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-[#555555] leading-relaxed">
                  {item.message}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  {item.linkTab ? (
                    <button
                      onClick={() => onNavigateTab(item.linkTab!)}
                      className="text-[11px] uppercase tracking-wider font-semibold text-[#141414] hover:underline flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <div />
                  )}

                  {!item.isRead && (
                    <button
                      onClick={() => onMarkAsRead(item.id)}
                      className="text-[11px] text-[#737373] hover:text-[#141414] transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

