"use client";

import { BillSummary } from "@/types/expense";

interface BalanceCardProps {
  summary: BillSummary;
}

export default function BalanceCard({ summary }: BalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
      <h2 className="text-lg font-bold mb-1">Summary</h2>
      <p className="text-xs text-purple-100 mb-3">Next Payment</p>
      
      <div className="space-y-2 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-purple-100">Total:</span>
          <span className="font-semibold">£{summary.totalAmount.toFixed(2)}</span>
        </div>
        {summary.overdueBills > 0 && (
          <div className="flex justify-between text-red-200">
            <span>Overdue:</span>
            <span className="font-semibold">{summary.overdueBills}</span>
          </div>
        )}
        {summary.unpaidBills > 0 && (
          <div className="flex justify-between text-yellow-200">
            <span>Unpaid:</span>
            <span className="font-semibold">{summary.unpaidBills}</span>
          </div>
        )}
      </div>

      <div className="border-t border-purple-400 pt-3 space-y-2 text-sm">
        <div>
          <p className="text-xs text-purple-100 mb-1">Ebe</p>
          <div className="flex justify-between text-xs">
            <span>Paid:</span>
            <span className="font-semibold">£{summary.ebePaidTotal.toFixed(2)}</span>
          </div>
          {summary.ebeOutstanding > 0 && (
            <div className="flex justify-between text-xs text-yellow-200 mt-0.5">
              <span>Due:</span>
              <span className="font-semibold">£{summary.ebeOutstanding.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-purple-100 mb-1">Ire</p>
          <div className="flex justify-between text-xs">
            <span>Paid:</span>
            <span className="font-semibold">£{summary.irePaidTotal.toFixed(2)}</span>
          </div>
          {summary.ireOutstanding > 0 && (
            <div className="flex justify-between text-xs text-yellow-200 mt-0.5">
              <span>Due:</span>
              <span className="font-semibold">£{summary.ireOutstanding.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {summary.unpaidBills === 0 && summary.totalBills > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-400 text-center">
          <p className="text-sm font-semibold text-green-200">✓ All Paid!</p>
        </div>
      )}
    </div>
  );
}