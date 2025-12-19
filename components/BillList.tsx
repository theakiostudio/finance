"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Bill, Person } from "@/types/expense";
import { format, parseISO } from "date-fns";
import { isBillOverdue } from "@/utils/balance";

interface BillListProps {
  bills: Bill[];
  onTogglePayment: (billId: string, person: Person) => void;
  onEdit: (bill: Bill) => void;
  onUpdateAmount?: (billId: string, person: Person, amount: number) => void;
  onUpdateBillAmount?: (billId: string, amount: number) => void;
}

function EditableAmountInput({ 
  bill, 
  monthBills, 
  onUpdateBillAmount 
}: { 
  bill: Bill; 
  monthBills: Bill[]; 
  onUpdateBillAmount?: (billId: string, amount: number) => void;
}) {
  // Use a stable key to prevent remounts - only change when bill ID changes
  const stableBillId = useMemo(() => bill.id, [bill.id]);
  
  // Initialize from bill prop only once - use lazy initializer
  const [localAmount, setLocalAmount] = useState<string>(() => bill.totalAmount?.toString() || "0");
  const isEditingRef = useRef<boolean>(false);
  const billIdRef = useRef<string>(stableBillId);
  const lastSyncedAmountRef = useRef<number>(bill.totalAmount || 0);
  const savedAmountRef = useRef<number | null>(null);
  const isInitialMountRef = useRef<boolean>(true);
  
  // Initialize refs on mount
  useEffect(() => {
    if (isInitialMountRef.current) {
      billIdRef.current = stableBillId;
      lastSyncedAmountRef.current = bill.totalAmount || 0;
      isInitialMountRef.current = false;
    }
  }, [stableBillId]);
  
  // Only sync from props when bill ID changes (completely different bill)
  // NEVER sync when totalAmount changes - this causes the reset issue
  useEffect(() => {
    // On initial mount, set the value from props
    if (isInitialMountRef.current) {
      const initialValue = bill.totalAmount?.toString() || "0";
      setLocalAmount(initialValue);
      return;
    }
    
    // Skip entirely if we're editing or if we just saved this amount
    if (isEditingRef.current || savedAmountRef.current !== null) {
      console.log('[EditableAmountInput] Skipping sync - editing or just saved');
      return;
    }
    
    // Only update if bill ID changed (completely different bill)
    if (billIdRef.current !== stableBillId) {
      console.log('[EditableAmountInput] Bill ID changed, resetting');
      billIdRef.current = stableBillId;
      lastSyncedAmountRef.current = bill.totalAmount || 0;
      setLocalAmount(bill.totalAmount?.toString() || "0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableBillId]); // Intentionally ONLY depend on stableBillId, NOT bill.totalAmount

  const handleSave = async (value: string) => {
    console.log('[EditableAmountInput] handleSave called with value:', value);
    const numValue = parseFloat(value);
    const finalAmount = isNaN(numValue) || numValue < 0 ? 0 : numValue;
    const finalAmountStr = finalAmount.toString();
    
    console.log('[EditableAmountInput] Final amount:', finalAmount, 'String:', finalAmountStr);
    
    // Keep the value we just typed - don't let it get reset
    setLocalAmount(finalAmountStr);
    console.log('[EditableAmountInput] Set localAmount to:', finalAmountStr);
    
    // Immediately update the input element to preserve the value
    if (inputRef.current) {
      inputRef.current.value = finalAmountStr;
      console.log('[EditableAmountInput] Updated input.value to:', finalAmountStr);
    } else {
      console.warn('[EditableAmountInput] inputRef.current is null!');
    }
    
    // Track that we saved this amount to prevent sync from overwriting it
    savedAmountRef.current = finalAmount;
    lastSyncedAmountRef.current = finalAmount;
    console.log('[EditableAmountInput] Set savedAmountRef to:', finalAmount);
    
    // Update the first bill in the month - handleUpdateBillAmount will update all bills in the same month
    if (onUpdateBillAmount && bill) {
      // Keep editing flag true during save
      isEditingRef.current = true;
      console.log('[EditableAmountInput] Calling onUpdateBillAmount for bill:', bill.id, 'amount:', finalAmount);
      await onUpdateBillAmount(bill.id, finalAmount);
      console.log('[EditableAmountInput] onUpdateBillAmount completed');
      
      // Ensure the value is still in the input after save completes
      if (inputRef.current) {
        console.log('[EditableAmountInput] After save, input.value is:', inputRef.current.value);
        inputRef.current.value = finalAmountStr;
        console.log('[EditableAmountInput] Set input.value again to:', finalAmountStr);
      }
      
      // Clear saved ref after a delay to allow future syncs, but keep the value
      setTimeout(() => {
        console.log('[EditableAmountInput] Timeout callback - checking input value');
        // Double-check the input still has the value
        if (inputRef.current) {
          console.log('[EditableAmountInput] Input value in timeout:', inputRef.current.value, 'Expected:', finalAmountStr);
          if (inputRef.current.value !== finalAmountStr) {
            console.warn('[EditableAmountInput] Input value was reset! Restoring to:', finalAmountStr);
            inputRef.current.value = finalAmountStr;
          }
        }
        savedAmountRef.current = null;
        isEditingRef.current = false;
        console.log('[EditableAmountInput] Cleared savedAmountRef and isEditingRef');
      }, 1500); // Longer delay to ensure parent state updates complete
    } else {
      savedAmountRef.current = null;
      isEditingRef.current = false;
    }
  };

  // Use a ref to track the input element and its value
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update input value from state, but only when not editing AND not just saved
  useEffect(() => {
    console.log('[EditableAmountInput] useEffect triggered - bill.totalAmount:', bill.totalAmount, 'isEditing:', isEditingRef.current, 'savedAmount:', savedAmountRef.current);
    // Never update the input if we just saved or are editing
    if (isEditingRef.current || savedAmountRef.current !== null) {
      console.log('[EditableAmountInput] Skipping sync - editing or just saved');
      return;
    }
    
    // Only update if the bill's totalAmount actually changed externally (not from our save)
    const billAmount = bill.totalAmount || 0;
    console.log('[EditableAmountInput] billAmount:', billAmount, 'lastSyncedAmount:', lastSyncedAmountRef.current);
    if (Math.abs(lastSyncedAmountRef.current - billAmount) > 0.01 && inputRef.current) {
      const newValue = billAmount.toString();
      console.log('[EditableAmountInput] Syncing input value to:', newValue);
      if (inputRef.current.value !== newValue) {
        inputRef.current.value = newValue;
        setLocalAmount(newValue);
        lastSyncedAmountRef.current = billAmount;
      }
    }
  }, [bill.totalAmount]); // Only react to bill.totalAmount changes

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">£</span>
      <input
        ref={inputRef}
        key={`amount-input-${stableBillId}`}
        type="number"
        step="0.01"
        min="0"
        value={localAmount}
        onChange={(e) => {
          // CRITICAL: Set editing flag IMMEDIATELY
          e.stopPropagation();
          e.preventDefault();
          isEditingRef.current = true;
          savedAmountRef.current = null; // Clear saved ref when user starts typing
          const newValue = e.target.value;
          console.log('[EditableAmountInput] onChange - newValue:', newValue);
          // Update local state - use controlled input
          setLocalAmount(newValue);
        }}
        onFocus={(e) => {
          isEditingRef.current = true;
          savedAmountRef.current = null;
        }}
        onBlur={(e) => {
          // Save when user leaves the input
          const value = e.target.value;
          handleSave(value);
          // Ensure the value stays in the input after save
          if (inputRef.current && value) {
            inputRef.current.value = value;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            handleSave(target.value);
            target.blur();
          }
        }}
        className="w-24 px-2 py-1 text-sm border-2 border-purple-300 dark:border-purple-600 rounded dark:bg-gray-700 dark:text-white font-medium text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
      />
    </div>
  );
}

export default function BillList({ bills, onTogglePayment, onEdit, onUpdateAmount, onUpdateBillAmount }: BillListProps) {
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
    const isCreditCardPot = billType === "Credit Card Pot";
    const isFlexibleBill = billType === "Water" || billType === "Electricity" || billType === "Credit Card Pot";
    
    // Get the next/earliest month's bills only
    const sortedMonths = Object.keys(monthlyGroups).sort();
    const nextMonthKey = sortedMonths[0];
    const nextMonthBills = nextMonthKey ? monthlyGroups[nextMonthKey] : [];
    
    // Calculate total amount for next month only
    // For Credit Card Pot, show total target amount
    const totalAmount = nextMonthBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalCount = nextMonthBills.length;
    
    // Calculate countdown to earliest due date (skip for Credit Card Pot and Water)
    const isWater = billType === "Water";
    let countdownText = "";
    if (!isCreditCardPot && !isWater && nextMonthBills.length > 0) {
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
    
    // For Credit Card Pot, calculate total paid
    const creditCardBill = isCreditCardPot ? nextMonthBills[0] : null;
    const totalPaid = creditCardBill 
      ? (creditCardBill.ebePaidAmount || 0) + (creditCardBill.irePaidAmount || 0)
      : 0;

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
            {isFlexibleBill && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                No fixed amount
              </span>
            )}
            {countdownText && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {countdownText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isCreditCardPot ? (
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  £{totalPaid.toFixed(2)} / £{totalAmount.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {((totalPaid / totalAmount) * 100).toFixed(0)}%
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                £{totalAmount.toFixed(2)}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {isOpen ? '▼' : '▶'}
            </span>
          </div>
        </button>
        {isOpen && (
          <div className="p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
            {Object.keys(monthlyGroups).sort().map((monthKey) => {
              const monthBills = monthlyGroups[monthKey];
              const isCreditCardPot = billType === "Credit Card Pot";
              const isFlexibleAmount = billType === "Water" || billType === "Electricity";
              
              // For Credit Card Pot, use the single bill
              const creditCardBill = isCreditCardPot ? monthBills[0] : null;
              const ebePaidAmount = creditCardBill?.ebePaidAmount || 0;
              const irePaidAmount = creditCardBill?.irePaidAmount || 0;
              const totalPaid = ebePaidAmount + irePaidAmount;
              
              // For flexible amount bills (Water/Electricity), use the first bill
              const flexibleBill = isFlexibleAmount ? monthBills[0] : null;
              
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
                    {isFlexibleAmount && flexibleBill ? (
                      <EditableAmountInput
                        key={`editable-amount-${flexibleBill.id}`}
                        bill={flexibleBill}
                        monthBills={monthBills}
                        onUpdateBillAmount={onUpdateBillAmount}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        £{monthTotal.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {isCreditCardPot ? (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Credit Card Pot - Amount Input for Ebe */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ebe Paid</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">£</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ebePaidAmount || ""}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value) || 0;
                              if (creditCardBill && onUpdateAmount) {
                                onUpdateAmount(creditCardBill.id, "Ebe", amount);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Credit Card Pot - Amount Input for Ire */}
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ire Paid</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">£</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={irePaidAmount || ""}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value) || 0;
                              if (creditCardBill && onUpdateAmount) {
                                onUpdateAmount(creditCardBill.id, "Ire", amount);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                        <p className="text-xs text-purple-800 dark:text-purple-200">
                          Total Paid: £{totalPaid.toFixed(2)} / £{monthTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : (
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
                  )}
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
