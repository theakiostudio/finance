import { Bill, BillSummary } from "@/types/expense";
import { format, isPast, parseISO, startOfMonth } from "date-fns";

export function getNextMonthBills(bills: Bill[]): Bill[] {
  if (bills.length === 0) return [];
  
  // Find the earliest due date
  const earliestDate = bills.reduce((earliest, bill) => {
    const billDate = parseISO(bill.dueDate);
    return billDate < earliest ? billDate : earliest;
  }, parseISO(bills[0].dueDate));
  
  // Get the month/year of the earliest date
  const nextMonth = startOfMonth(earliestDate);
  
  // Filter bills that are in the same month
  return bills.filter(bill => {
    const billDate = parseISO(bill.dueDate);
    const billMonth = startOfMonth(billDate);
    return billMonth.getTime() === nextMonth.getTime();
  });
}

export function getCurrentAndNextMonthNames(bills: Bill[]): { current: string; next: string | null } | null {
  if (bills.length === 0) return null;
  
  // Find the earliest due date (current payment month)
  const earliestDate = bills.reduce((earliest, bill) => {
    const billDate = parseISO(bill.dueDate);
    return billDate < earliest ? billDate : earliest;
  }, parseISO(bills[0].dueDate));
  
  const currentMonth = format(startOfMonth(earliestDate), "MMMM");
  
  // Find the next month's bills
  const sortedBills = [...bills].sort((a, b) => 
    parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
  );
  
  // Find the first bill that's not in the current month
  const nextMonthBill = sortedBills.find(bill => {
    const billDate = parseISO(bill.dueDate);
    const billMonth = startOfMonth(billDate);
    const currentMonthStart = startOfMonth(earliestDate);
    return billMonth.getTime() > currentMonthStart.getTime();
  });
  
  const nextMonth = nextMonthBill 
    ? format(startOfMonth(parseISO(nextMonthBill.dueDate)), "MMMM")
    : null;
  
  return {
    current: currentMonth,
    next: nextMonth,
  };
}

export function calculateBillSummary(bills: Bill[]): BillSummary {
  // Only calculate summary for the next month's bills
  const nextMonthBills = getNextMonthBills(bills);
  let totalAmount = 0;
  let unpaidBills = 0;
  let overdueBills = 0;
  let ireOutstanding = 0;
  let ebeOutstanding = 0;
  let irePaidTotal = 0;
  let ebePaidTotal = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  nextMonthBills.forEach((bill) => {
    const amountPerPerson = bill.totalAmount / 2;
    totalAmount += bill.totalAmount;

    const dueDate = parseISO(bill.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate days until due date (negative if overdue, 0 if today, positive if future)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // A bill is overdue if the due date has passed (daysUntilDue < 0)
    const isOverdue = daysUntilDue < 0;
    // A bill is due soon if it's due within 3 days (today = 0, tomorrow = 1, etc.)
    const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

    // Only count as unpaid if it's due soon (within 3 days) or overdue
    if ((isDueSoon || isOverdue) && (!bill.irePaid || !bill.ebePaid)) {
      unpaidBills++;
    }

    if (isOverdue && (!bill.irePaid || !bill.ebePaid)) {
      overdueBills++;
    }

    if (bill.irePaid) {
      irePaidTotal += amountPerPerson;
    } else {
      ireOutstanding += amountPerPerson;
    }

    if (bill.ebePaid) {
      ebePaidTotal += amountPerPerson;
    } else {
      ebeOutstanding += amountPerPerson;
    }
  });

  return {
    totalBills: nextMonthBills.length,
    totalAmount,
    unpaidBills,
    overdueBills,
    ireOutstanding,
    ebeOutstanding,
    irePaidTotal,
    ebePaidTotal,
  };
}

export function isBillOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}
