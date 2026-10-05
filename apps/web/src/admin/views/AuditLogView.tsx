import React, { useState, useEffect } from 'react';
import { AdminAuditEntry } from '../types';
import { AdminApi } from '../api';
import { History, Filter, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.getAuditLogs(resourceFilter);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [resourceFilter]);

  const resources = [
    { id: 'ALL', label: 'All Operations' },
    { id: 'ORDER', label: 'Order Transitions' },
    { id: 'INVENTORY', label: 'Stock Adjustments' },
    { id: 'PRODUCT', label: 'Product Catalog' },
    { id: 'SHIPMENT', label: 'Shipments' },
    { id: 'SETTINGS', label: 'System & Auth' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A3A199] block mb-0.5">
            SECURITY & COMPLIANCE
          </span>
          <h2 className="text-xl font-bold text-[#F2F0EB]">Administrative Audit Trail</h2>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#242424] text-xs font-mono">
        {resources.map((res) => (
          <button
            key={res.id}
            onClick={() => setResourceFilter(res.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              resourceFilter === res.id
                ? 'bg-[#F2F0EB] text-[#0A0A0A] font-bold'
                : 'text-[#A3A199] hover:text-[#F2F0EB] hover:bg-white/5'
            }`}
          >
            {res.label}
          </button>
        ))}
      </div>

      {/* Audit Logs Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#F2F0EB]" />
            <span className="text-xs font-mono text-neutral-400">RETRIEVING AUDIT LOGS...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-800 text-red-200 text-xs text-center">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-[#F2F0EB]">No audit entries yet</p>
            <p className="text-xs text-neutral-500 font-sans">
              All mutative administrative events (status updates, manual restocks, price changes) are automatically written here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-[10px] font-mono text-[#A3A199] uppercase tracking-wider">
                  <th className="py-3 font-normal">Timestamp</th>
                  <th className="py-3 font-normal">Admin</th>
                  <th className="py-3 font-normal">Action</th>
                  <th className="py-3 font-normal">Resource</th>
                  <th className="py-3 font-normal">Identifier</th>
                  <th className="py-3 font-normal">Details / Transition</th>
                  <th className="py-3 font-normal text-right">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020] font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 text-neutral-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 text-[#F2F0EB]">
                      {log.adminEmail}
                    </td>

                    <td className="py-3.5">
                      <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 text-neutral-300">
                      {log.resource}
                    </td>

                    <td className="py-3.5 font-bold text-[#F2F0EB]">
                      {log.resourceId}
                    </td>

                    <td className="py-3.5 text-neutral-300 text-[11px]">
                      {log.previousValue ? (
                        <span>
                          <span className="text-neutral-500">{log.previousValue}</span> →{' '}
                          <span className="text-emerald-400 font-semibold">{log.newValue}</span>
                        </span>
                      ) : (
                        <span>{log.newValue || '—'}</span>
                      )}
                    </td>

                    <td className="py-3.5 text-right text-neutral-400 font-sans text-[11px]">
                      {log.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
