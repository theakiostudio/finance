"use client";

import { useState } from "react";
import { Bill, Person } from "@/types/expense";
import { format, parseISO } from "date-fns";
import { isBillOverdue } from "@/utils/balance";

interface BillListProps {
  bills: Bill[];
  onTogglePayment: (billId: string, person: Person) => void;
  onEdit: (bill: Bill) => void;
}

export default function BillList({ bills, onTogglePayment, onEdit }: BillListProps) {
  const [openTabs, setOpenTabs] = useState<Record<string, boolean>>({
    "Rent": false,
    "Council Tax": false,
    "Water": false,
    "Electricity": false,
    "Credit Card Pot": false,
  });

  const toggleTab = (billType: string) => {
    setOpenTabs(prev => ({
      ...prev,
      [billType]: !prev[billType]
    }));
  };
  if (bills.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No bills yet.</p>
      </div>
    );
  }


  // Group bills by type, then by month
  const groupedByType = bills.reduce((acc, bill) => {
    const key = bill.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(bill);
    return acc;
  }, {} as Record<string, typeof bills>);

  // Group by month within each type
  const groupedBills: Record<string, Record<string, typeof bills>> = {};
  Object.keys(groupedByType).forEach(billType => {
    groupedBills[billType] = groupedByType[billType].reduce((acc, bill) => {
      const date = parseISO(bill.dueDate);
      const monthKey = format(date, "yyyy-MM"); // e.g., "2024-01"
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(bill);
      return acc;
    }, {} as Record<string, typeof bills>);
    
    // Sort months
    Object.keys(groupedBills[billType]).forEach(monthKey => {
      groupedBills[billType][monthKey].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });
  });

  // Define order for bill types
  const allBillTypes = ["Rent", "Council Tax", "Water", "Electricity", "Credit Card Pot"];
  
  // Sort bill types by earliest due date, prioritizing bills due soon (within 3 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sortedBillTypes = allBillTypes
    .filter(type => groupedBills[type] && Object.keys(groupedBills[type]).length > 0)
    .sort((a, b) => {
      // Get all bills for each type and find the earliest due date
      const aBills = groupedBills[a];
      const bBills = groupedBills[b];
      
      const aAllBills = Object.values(aBills).flat();
      const bAllBills = Object.values(bBills).flat();
      
      const aEarliestDate = aAllBills.reduce((earliest, bill) => {
        const billDate = parseISO(bill.dueDate).getTime();
        return billDate < earliest ? billDate : earliest;
      }, Infinity);
      
      const bEarliestDate = bAllBills.reduce((earliest, bill) => {
        const billDate = parseISO(bill.dueDate).getTime();
        return billDate < earliest ? billDate : earliest;
      }, Infinity);
      
      // Check if either has a bill due soon (within 3 days)
      const aHasDueSoon = aAllBills.some(bill => {
        const billDate = parseISO(bill.dueDate);
        billDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((billDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 3 && (!bill.irePaid || !bill.ebePaid);
      });
      
      const bHasDueSoon = bAllBills.some(bill => {
        const billDate = parseISO(bill.dueDate);
        billDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((billDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 3 && (!bill.irePaid || !bill.ebePaid);
      });
      
      // Prioritize bills due soon
      if (aHasDueSoon && !bHasDueSoon) return -1;
      if (!aHasDueSoon && bHasDueSoon) return 1;
      
      // If both or neither are due soon, sort by earliest date
      return aEarliestDate - bEarliestDate;
    });
  
  const otherBillTypes = Object.keys(groupedBills).filter(key => !allBillTypes.includes(key));

  const renderBillGroup = (billType: string, monthlyGroups: Record<string, typeof bills>) => {
    const isOpen = openTabs[billType] !== false;
    
    // Get the next/earliest month's bills only
    const sortedMonths = Object.keys(monthlyGroups).sort();
    const nextMonthKey = sortedMonths[0];
    const nextMonthBills = nextMonthKey ? monthlyGroups[nextMonthKey] : [];
    
    // Calculate total amount for next month only
    const totalAmount = nextMonthBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalCount = nextMonthBills.length;
    
    // Calculate countdown to earliest due date (skip for Water)
    const isWater = billType === "Water";
    let countdownText = "";
    if (!isWater && nextMonthBills.length > 0) {
      const earliestBill = nextMonthBills.reduce((earliest, bill) => {
        const billDate = parseISO(bill.dueDate).getTime();
        const earliestDate = parseISO(earliest.dueDate).getTime();
        return billDate < earliestDate ? bill : earliest;
      }, nextMonthBills[0]);
      
      const dueDate = parseISO(earliestBill.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        countdownText = `overdue`;
      } else if (daysUntilDue === 0) {
        countdownText = `today`;
      } else if (daysUntilDue === 1) {
        countdownText = `in 1 day`;
      } else {
        countdownText = `in ${daysUntilDue} days`;
      }
    }
    

    return (
      <div key={billType} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleTab(billType)}
          className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {billType}
            </span>
            {countdownText && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {countdownText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              £{totalAmount.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {isOpen ? '▼' : '▶'}
            </span>
          </div>
        </button>
        {isOpen && (
          <div className="p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
            {Object.keys(monthlyGroups).sort().map((monthKey) => {
              const monthBills = monthlyGroups[monthKey];
              
              // Recalculate monthTotal from current bills (in case amount was updated)
              const monthTotal = monthBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
              const monthName = format(parseISO(monthBills[0].dueDate), "MMMM yyyy");
              
              // Calculate monthly payment status
              const ebePaid = monthBills.every(bill => bill.ebePaid);
              const irePaid = monthBills.every(bill => bill.irePaid);
              const ebePartiallyPaid = monthBills.some(bill => bill.ebePaid) && !ebePaid;
              const irePartiallyPaid = monthBills.some(bill => bill.irePaid) && !irePaid;
              const amountPerPerson = monthTotal > 0 ? monthTotal / 2 : 0;
              
              // Check if month is overdue - only if the latest due date in the month has passed
              const latestDueDate = monthBills.reduce((latest, bill) => {
                const billDate = parseISO(bill.dueDate);
                return billDate > latest ? billDate : latest;
              }, parseISO(monthBills[0].dueDate));
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              latestDueDate.setHours(0, 0, 0, 0);
              
              // Only show as overdue if the latest due date has passed AND bills are unpaid
              const hasOverdue = latestDueDate < today && (!ebePaid || !irePaid);
              
              // Check if due soon (3 days or less)
              const daysUntilDue = Math.ceil((latestDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3 && (!ebePaid || !irePaid) && !hasOverdue;

              return (
                <div
                  key={monthKey}
                  className={`border rounded-lg p-3 transition-colors ${
                    hasOverdue
                      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                      : ebePaid && irePaid
                      ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                      : isDueSoon
                      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {monthName}
                      </h3>
                      {hasOverdue && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                          Overdue
                        </span>
                      )}
                      {isDueSoon && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                          Due soon
                        </span>
                      )}
                      {ebePaid && irePaid && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          Paid
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      £{monthTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      {/* Ebe Payment */}
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Ebe</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            £{amountPerPerson.toFixed(2)}
                          </p>
                          {ebePaid && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Paid
                            </p>
                          )}
                          {ebePartiallyPaid && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                              Partial
                            </p>
                          )}
                        </div>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Determine if we should set all to paid or unpaid
                            const shouldMarkPaid = !ebePaid;
                            // Update all bills in this month for Ebe
                            for (const bill of monthBills) {
                              if (bill.ebePaid !== shouldMarkPaid) {
                                await onTogglePayment(bill.id, "Ebe");
                              }
                            }
                          }}
                          className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors text-sm ${
                            ebePaid
                              ? "bg-green-500 border-green-600 text-white"
                              : ebePartiallyPaid
                              ? "bg-yellow-500 border-yellow-600 text-white"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                          }`}
                        >
                          {ebePaid && "✓"}
                          {ebePartiallyPaid && "~"}
                        </button>
                      </div>

                      {/* Ire Payment */}
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Ire</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            £{amountPerPerson.toFixed(2)}
                          </p>
                          {irePaid && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Paid
                            </p>
                          )}
                          {irePartiallyPaid && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                              Partial
                            </p>
                          )}
                        </div>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            // Determine if we should set all to paid or unpaid
                            const shouldMarkPaid = !irePaid;
                            // Update all bills in this month for Ire
                            for (const bill of monthBills) {
                              if (bill.irePaid !== shouldMarkPaid) {
                                await onTogglePayment(bill.id, "Ire");
                              }
                            }
                          }}
                          className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors text-sm ${
                            irePaid
                              ? "bg-green-500 border-green-600 text-white"
                              : irePartiallyPaid
                              ? "bg-yellow-500 border-yellow-600 text-white"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                          }`}
                        >
                          {irePaid && "✓"}
                          {irePartiallyPaid && "~"}
                        </button>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Bills</h2>
      <div className="space-y-4">
        {sortedBillTypes.map((billType) => {
          const monthlyGroups = groupedBills[billType];
          if (!monthlyGroups || Object.keys(monthlyGroups).length === 0) return null;
          return renderBillGroup(billType, monthlyGroups);
        })}
        {otherBillTypes.map((billType) => {
          const monthlyGroups = groupedBills[billType];
          if (!monthlyGroups || Object.keys(monthlyGroups).length === 0) return null;
          return renderBillGroup(billType, monthlyGroups);
        })}
      </div>
    </div>
  );
}
