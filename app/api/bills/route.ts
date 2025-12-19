import { NextRequest, NextResponse } from "next/server";
import { Bill } from "@/types/expense";
import { format, addMonths, setDate } from "date-fns";
import { getBillsFromDB, saveBillToDB, deleteBillFromDB, initDatabase } from "@/lib/db";

// In-memory storage (fallback if database is not available)
let billsStorage: Bill[] = [];

// Initialize with default bills if empty
function initializeDefaultBills(): Bill[] {
  const bills: Bill[] = [];
  const now = Date.now();
  const today = new Date();
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
      totalAmount: 0.00,
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

  // Credit Card Pot - single payment
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
    irePaidAmount: 0,
    ebePaidAmount: 0,
    createdAt: now + billCounter++,
  });

  return bills;
}

export async function GET(request: NextRequest) {
  try {
    // Check if status query parameter is requested
    const { searchParams } = new URL(request.url);
    const checkStatus = searchParams.get('status') === 'true';
    
    // Try to fetch from database first
    let bills = await getBillsFromDB();
    let dbStatus = 'connected';
    
    // If database is empty or unavailable, check if we need to initialize
    if (bills.length === 0) {
      const today = new Date();
      const todayMonth = today.getMonth();
      const todayYear = today.getFullYear();
      
      // Generate default bills
      const defaultBills = initializeDefaultBills();
      
      // Save default bills to database
      try {
        await initDatabase();
        for (const bill of defaultBills) {
          await saveBillToDB(bill);
        }
        bills = defaultBills;
        dbStatus = 'connected';
      } catch (dbError) {
        // Database not available, use in-memory storage
        console.log("Database not available, using in-memory storage");
        dbStatus = 'not_connected';
        billsStorage = defaultBills;
        bills = defaultBills;
      }
    }
    
    // If status check requested, return status info
    if (checkStatus) {
      return NextResponse.json({
        status: dbStatus,
        database: dbStatus === 'connected' ? 'available' : 'unavailable',
        billsCount: bills.length,
        message: dbStatus === 'connected' 
          ? 'Database is working correctly!' 
          : 'Database is not set up. Using localStorage fallback.'
      });
    }
    
    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    // Fallback to in-memory storage
    if (billsStorage.length === 0) {
      billsStorage = initializeDefaultBills();
    }
    
    // Check if status was requested
    const { searchParams } = new URL(request.url);
    if (searchParams.get('status') === 'true') {
      return NextResponse.json({
        status: 'error',
        database: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Error checking database status'
      });
    }
    
    return NextResponse.json(billsStorage);
  }
}

export async function POST(request: NextRequest) {
  try {
    const bill: Bill = await request.json();
    
    // Try to save to database first
    try {
      await saveBillToDB(bill);
      return NextResponse.json(bill, { status: 201 });
    } catch (dbError) {
      // Database not available, use in-memory storage
      console.log("Database not available, using in-memory storage");
      if (billsStorage.length === 0) {
        billsStorage = initializeDefaultBills();
      }
      
      const existingIndex = billsStorage.findIndex(b => b.id === bill.id);
      if (existingIndex !== -1) {
        billsStorage[existingIndex] = bill;
        return NextResponse.json(bill);
      }
      
      billsStorage.push(bill);
      return NextResponse.json(bill, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const bill: Bill = await request.json();
    
    // Try to save to database first
    try {
      await saveBillToDB(bill);
      return NextResponse.json(bill);
    } catch (dbError) {
      // Database not available, use in-memory storage
      console.log("Database not available, using in-memory storage");
      if (billsStorage.length === 0) {
        billsStorage = initializeDefaultBills();
      }
      
      const index = billsStorage.findIndex(b => b.id === bill.id);
      if (index === -1) {
        billsStorage.push(bill);
      } else {
        billsStorage[index] = bill;
      }
      return NextResponse.json(bill);
    }
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Bill ID required" }, { status: 400 });
    }
    
    // Try to delete from database first
    try {
      await deleteBillFromDB(id);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      // Database not available, use in-memory storage
      console.log("Database not available, using in-memory storage");
      billsStorage = billsStorage.filter(b => b.id !== id);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
  }
}
