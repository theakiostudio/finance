"use client";

import { useState, useEffect } from "react";
import { Bill, Person } from "@/types/expense";
import { getBills, updateBill, resetBills } from "@/utils/storage";
import { fetchBills } from "@/utils/api";
import { calculateBillSummary } from "@/utils/balance";
import BillList from "@/components/BillList";
import BalanceCard from "@/components/BalanceCard";
import EditBillModal from "@/components/EditBillModal";
import { format, isPast, parseISO } from "date-fns";

export default function Home() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  useEffect(() => {
    setMounted(true);
    const loadBills = async () => {
      try {
        const allBills = await getBills();
        
        // Filter out bills in the past - only show future bills
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const billsToFilter = allBills;
        const futureBills = allBills.filter(bill => {
          const dueDate = parseISO(bill.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today;
        });
        
        // Check if we have all expected bill types
        const billTypes = new Set(futureBills.map(b => b.name));
        const expectedTypes = ["Rent", "Council Tax", "Water", "Electricity", "Credit Card Pot"];
        const hasAllTypes = expectedTypes.every(type => billTypes.has(type));
        
        // If we don't have bills, initialize them
        if (allBills.length === 0) {
          // Force initialization by calling API
          await fetchBills();
          const regeneratedBills = await getBills();
          const filteredRegenerated = regeneratedBills.filter(bill => {
            const dueDate = parseISO(bill.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today;
          });
          setBills(filteredRegenerated);
        } else if (futureBills.length === 0 || (!hasAllTypes && futureBills.length < 10)) {
          // If no future bills, show all bills (maybe we're past October)
          // Or regenerate if structure is incomplete
          await resetBills();
          const regeneratedBills = await getBills();
          // Show all bills if we're past the end date
          const billsToShow = regeneratedBills.filter(bill => {
            const dueDate = parseISO(bill.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            // If we're past October, show all bills from this year
            return dueDate >= today || dueDate.getFullYear() === today.getFullYear();
          });
          setBills(billsToShow);
        } else {
          setBills(futureBills);
        }
      } catch (error) {
        console.error("Error loading bills:", error);
      }
    };
    loadBills();
  }, []);

  const handleTogglePayment = async (billId: string, person: Person) => {
    // Use functional update to get latest state - prevents stale closures
    setBills(prevBills => {
      const bill = prevBills.find(b => b.id === billId);
      if (!bill) return prevBills;

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const newPaidStatus = !bill[person === "Ire" ? "irePaid" : "ebePaid"];
      
      const updatedBill: Bill = {
        ...bill,
        [person === "Ire" ? "irePaid" : "ebePaid"]: newPaidStatus,
        [person === "Ire" ? "irePaidDate" : "ebePaidDate"]: newPaidStatus ? todayStr : null,
      };

      // Update the bill asynchronously - don't await here
      updateBill(updatedBill).catch(error => {
        console.error("Error updating bill:", error);
        // Revert on error - could add error handling here if needed
      });

      return prevBills.map(b => b.id === billId ? updatedBill : b);
    });
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
  };

  const handleSaveBill = async (updatedBill: Bill) => {
    await updateBill(updatedBill);
    const allBills = await getBills();
    // Filter out past bills
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureBills = allBills.filter(bill => {
      const dueDate = parseISO(bill.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today;
    });
    setBills(futureBills);
    setEditingBill(null);
  };


  const summary = calculateBillSummary(bills);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Finance Splitter
          </h1>
          <p>Track and split bills 50/50 between Ebe and Ire.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-1">
            <BalanceCard summary={summary} />
          </div>
          <div className="lg:col-span-3">
            <BillList 
              bills={bills} 
              onTogglePayment={handleTogglePayment} 
              onEdit={handleEditBill}
            />
          </div>
        </div>
      </div>

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          onSave={handleSaveBill}
        />
      )}
    </div>
  );
}// Force redeploy Fri Dec 19 17:08:24 GMT 2025
