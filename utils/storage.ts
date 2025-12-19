import { Bill } from "@/types/expense";
import { format, addMonths, setDate } from "date-fns";
import { fetchBills, updateBill as updateBillAPI, createBill as createBillAPI, deleteBill as deleteBillAPI } from "./api";

const STORAGE_KEY = "finance-splitter-bills";

function getDefaultBills(): Bill[] {
  const now = Date.now();
  const today = new Date();
  const bills: Bill[] = [];
  let billCounter = 0;

  // Determine the end month (October) - always end in October of current year
  // But if we're past October, generate bills for next year
  const endYear = today.getFullYear();
  let targetYear = endYear;
  const todayMonth = today.getMonth();
  
  // If we're past October (month 9), generate bills for next year
  if (todayMonth > 9) {
    targetYear = endYear + 1;
  }
  
  const endMonth = new Date(targetYear, 9, 1); // October 1st (month 9 is October)
  
  // Start from January of the target year
  let startMonth = new Date(targetYear, 0, 1); // January 1st

  // Generate Rent bills (1st of each month until October)
  let currentMonth = new Date(startMonth);

  while (currentMonth <= endMonth && currentMonth.getFullYear() === targetYear) {
    const rentDate = format(setDate(currentMonth, 1), "yyyy-MM-dd");
    bills.push({
      id: `bill-rent-${rentDate}`,
      name: "Rent",
      totalAmount: 1420.00,
      dueDate: rentDate,
      irePaid: false,
      ebePaid: false,
      irePaidDate: null,
      ebePaidDate: null,
      createdAt: now + billCounter++,
    });
    currentMonth = addMonths(currentMonth, 1);
  }

  // Generate Council Tax bills (1st of each month until October)
  currentMonth = new Date(startMonth);
  while (currentMonth <= endMonth && currentMonth.getFullYear() === targetYear) {
    const councilTaxDate = format(setDate(currentMonth, 1), "yyyy-MM-dd");
    bills.push({
      id: `bill-council-tax-${councilTaxDate}`,
      name: "Council Tax",
      totalAmount: 153.00,
      dueDate: councilTaxDate,
      irePaid: false,
      ebePaid: false,
      irePaidDate: null,
      ebePaidDate: null,
      createdAt: now + billCounter++,
    });
    currentMonth = addMonths(currentMonth, 1);
  }

  // Generate Water bills (1st of each month until October) - amount is variable, set to 0
  currentMonth = new Date(startMonth);
  while (currentMonth <= endMonth && currentMonth.getFullYear() === targetYear) {
    const waterDate = format(setDate(currentMonth, 1), "yyyy-MM-dd");
    bills.push({
      id: `bill-water-${waterDate}`,
      name: "Water",
      totalAmount: 0.00, // Variable amount - to be updated
      dueDate: waterDate,
      irePaid: false,
      ebePaid: false,
      irePaidDate: null,
      ebePaidDate: null,
      createdAt: now + billCounter++,
    });
    currentMonth = addMonths(currentMonth, 1);
  }

  // Generate Electricity bills (19th of each month until December)
  // Electricity continues beyond October, so generate until December
  // If we're in December 2025, also generate December 2025 bill
  let electricityStartMonth = new Date(startMonth);
  let electricityEndMonth = new Date(targetYear, 11, 1); // December 1st (month 11 is December)
  
  // If we're in December 2025 and generating for 2026, also add December 2025 Electricity
  if (todayMonth === 11 && targetYear === endYear + 1) {
    // Generate December 2025 Electricity first
    const dec2025Date = format(setDate(new Date(endYear, 11, 1), 19), "yyyy-MM-dd");
    bills.push({
      id: `bill-electricity-${dec2025Date}`,
      name: "Electricity",
      totalAmount: 0.00,
      dueDate: dec2025Date,
      irePaid: false,
      ebePaid: false,
      irePaidDate: null,
      ebePaidDate: null,
      createdAt: now + billCounter++,
    });
  }
  
  currentMonth = electricityStartMonth;
  while (currentMonth <= electricityEndMonth && currentMonth.getFullYear() === targetYear) {
    const electricityDate = format(setDate(currentMonth, 19), "yyyy-MM-dd");
    // January onwards should have no fixed amount (0.00)
    const electricityAmount = 0.00;
    bills.push({
      id: `bill-electricity-${electricityDate}`,
      name: "Electricity",
      totalAmount: electricityAmount,
      dueDate: electricityDate,
      irePaid: false,
      ebePaid: false,
      irePaidDate: null,
      ebePaidDate: null,
      createdAt: now + billCounter++,
    });
    currentMonth = addMonths(currentMonth, 1);
  }

  // Credit Card Pot - single payment (doesn't end in October, but adding it as a goal/target)
  // Setting due date to end of October for tracking purposes
  const creditCardDate = format(new Date(targetYear, 9, 31), "yyyy-MM-dd"); // October 31
  bills.push({
    id: "bill-credit-card-pot",
    name: "Credit Card Pot",
    totalAmount: 5400.00,
    dueDate: creditCardDate,
    irePaid: false,
    ebePaid: false,
    irePaidDate: null,
    ebePaidDate: null,
    createdAt: now + billCounter++,
  });

  return bills;
}

export async function getBills(): Promise<Bill[]> {
  try {
    const bills = await fetchBills();
    // Also save to localStorage as backup
    if (typeof window !== "undefined" && bills.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
    }
    return bills;
  } catch (error) {
    console.error("Error loading bills from API:", error);
    // Fallback to localStorage if API fails
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
      }
    }
    return [];
  }
}

export async function saveBills(bills: Bill[]): Promise<void> {
  // Save to API - update each bill individually
  // For better performance in production, create a batch update endpoint
  try {
    for (const bill of bills) {
      try {
        await updateBillAPI(bill);
      } catch {
        // If update fails, try creating
        await createBillAPI(bill);
      }
    }
    
    // Also save to localStorage as backup
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    }
  } catch (error) {
    console.error("Error saving bills:", error);
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
    }
  }
}

export async function addBill(bill: Bill): Promise<void> {
  try {
    await createBillAPI(bill);
  } catch (error) {
    console.error("Error adding bill:", error);
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      const bills = stored ? JSON.parse(stored) : [];
      bills.push(bill);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    }
  }
}

export async function updateBill(updatedBill: Bill): Promise<void> {
  // Always update localStorage immediately for persistence
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const bills = stored ? JSON.parse(stored) : [];
      const index = bills.findIndex((b: Bill) => b.id === updatedBill.id);
      if (index !== -1) {
        bills[index] = updatedBill;
      } else {
        bills.push(updatedBill);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    } catch (e) {
      console.error("Error updating localStorage:", e);
    }
  }
  
  // Try to sync with API/database
  try {
    await updateBillAPI(updatedBill);
    // If API succeeds, update localStorage with latest from server
    const allBills = await fetchBills();
    if (typeof window !== "undefined" && allBills.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allBills));
    }
  } catch (error) {
    console.error("Error updating bill on server:", error);
    // localStorage already updated above, so data is persisted
  }
}

export async function deleteBill(id: string): Promise<void> {
  try {
    await deleteBillAPI(id);
  } catch (error) {
    console.error("Error deleting bill:", error);
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      const bills = stored ? JSON.parse(stored) : [];
      const filtered = bills.filter((bill: Bill) => bill.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  }
}

export async function resetBills(): Promise<void> {
  // Force regeneration by fetching fresh bills from API
  // The API will initialize if empty
  try {
    await fetchBills();
  } catch (error) {
    console.error("Error resetting bills:", error);
  }
  
  // Also clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
