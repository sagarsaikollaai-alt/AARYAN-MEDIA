import React from 'react';

export interface PurchaseRecord {
  id: string;
  courseName: string;
  amount: number; // in rupees
  method: string;
  date: string; // display-ready date string e.g. "31 Jul 2026"
  status: 'success' | 'failed' | 'pending';
}

interface BillingTabProps {
  purchases: PurchaseRecord[];
}

const statusStyles: Record<PurchaseRecord['status'], string> = {
  success: 'text-[#4ADE80]',
  failed: 'text-red-400',
  pending: 'text-yellow-400',
};

export function BillingTab({ purchases }: BillingTabProps) {
  return (
    <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-6">Purchase History</h2>

      {purchases.length === 0 ? (
        <p className="text-zinc-500 text-sm py-8 text-center">No purchases yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-[11px] uppercase tracking-wider border-b border-white/[0.08]">
                <th className="pb-3 font-medium pr-4">Course</th>
                <th className="pb-3 font-medium pr-4">Amount</th>
                <th className="pb-3 font-medium pr-4">Method</th>
                <th className="pb-3 font-medium pr-4">Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="py-4 pr-4 font-semibold text-white">{p.courseName}</td>
                  <td className="py-4 pr-4 text-zinc-300">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="py-4 pr-4 text-zinc-400">{p.method}</td>
                  <td className="py-4 pr-4 text-zinc-400">{p.date}</td>
                  <td className={`py-4 font-bold text-xs ${statusStyles[p.status]}`}>
                    {p.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}