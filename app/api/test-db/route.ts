import { NextResponse } from "next/server";
import { initDatabase, getBillsFromDB } from "@/lib/db";

// Database connection test endpoint
export async function GET() {
  try {
    // Try to initialize the database
    try {
      await initDatabase();
      const bills = await getBillsFromDB();
      
      return NextResponse.json({
        status: "connected",
        database: "available",
        billsCount: bills.length,
        message: "Database is working correctly!"
      });
    } catch (error: any) {
      return NextResponse.json({
        status: "not_connected",
        database: "unavailable",
        error: error.message || "Database connection failed",
        message: "Database is not set up. Using localStorage fallback.",
        fallback: "localStorage"
      }, { status: 200 }); // Return 200 so we can see the status
    }
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message || "Unknown error",
      message: "Error checking database status"
    }, { status: 500 });
  }
}
