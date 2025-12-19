import { Bill } from '@/types/expense';

// Try to import @vercel/postgres, but handle gracefully if not available
let sql: any = null;
try {
  const postgres = require('@vercel/postgres');
  
  // Check if database environment variables are set
  // Using the specific variable names from Vercel: db_POSTGRES_URL and db_PRISMA_DATABASE_URL
  // Map them to the standard names that @vercel/postgres expects
  if (process.env.db_POSTGRES_URL && !process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = process.env.db_POSTGRES_URL;
  }
  if (process.env.db_PRISMA_DATABASE_URL && !process.env.POSTGRES_PRISMA_URL) {
    process.env.POSTGRES_PRISMA_URL = process.env.db_PRISMA_DATABASE_URL;
  }
  
  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_PRISMA_URL) {
    console.log('Database package available but no connection string found. Using fallback storage.');
    sql = null;
  } else {
    sql = postgres.sql;
  }
} catch (error) {
  // Database not available, will use fallback
  console.log('Database package not available, using fallback storage');
}

// Initialize the bills table if it doesn't exist
export async function initDatabase() {
  if (!sql) {
    throw new Error('Database not available');
  }
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        ire_paid BOOLEAN DEFAULT false,
        ebe_paid BOOLEAN DEFAULT false,
        ire_paid_date DATE,
        ebe_paid_date DATE,
        ire_paid_amount DECIMAL(10, 2),
        ebe_paid_amount DECIMAL(10, 2),
        created_at BIGINT NOT NULL
      );
    `;
  } catch (error) {
    console.error('Error initializing database:', error);
    // If database is not available, we'll fall back to in-memory storage
  }
}

// Fetch all bills from database
export async function getBillsFromDB(): Promise<Bill[]> {
  if (!sql) {
    return [];
  }
  try {
    await initDatabase();
    const result = await sql`
      SELECT 
        id,
        name,
        total_amount as "totalAmount",
        due_date as "dueDate",
        ire_paid as "irePaid",
        ebe_paid as "ebePaid",
        ire_paid_date as "irePaidDate",
        ebe_paid_date as "ebePaidDate",
        ire_paid_amount as "irePaidAmount",
        ebe_paid_amount as "ebePaidAmount",
        created_at as "createdAt"
      FROM bills
      ORDER BY due_date ASC;
    `;
    
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      totalAmount: parseFloat(row.totalAmount),
      dueDate: row.dueDate,
      irePaid: row.irePaid,
      ebePaid: row.ebePaid,
      irePaidDate: row.irePaidDate,
      ebePaidDate: row.ebePaidDate,
      irePaidAmount: row.irePaidAmount ? parseFloat(row.irePaidAmount) : undefined,
      ebePaidAmount: row.ebePaidAmount ? parseFloat(row.ebePaidAmount) : undefined,
      createdAt: parseInt(row.createdAt),
    }));
  } catch (error) {
    console.error('Error fetching bills from database:', error);
    return [];
  }
}

// Save a bill to database (insert or update)
export async function saveBillToDB(bill: Bill): Promise<void> {
  if (!sql) {
    throw new Error('Database not available');
  }
  try {
    await initDatabase();
    await sql`
      INSERT INTO bills (
        id, name, total_amount, due_date, ire_paid, ebe_paid,
        ire_paid_date, ebe_paid_date, ire_paid_amount, ebe_paid_amount, created_at
      )
      VALUES (
        ${bill.id}, ${bill.name}, ${bill.totalAmount}, ${bill.dueDate},
        ${bill.irePaid}, ${bill.ebePaid}, ${bill.irePaidDate}, ${bill.ebePaidDate},
        ${bill.irePaidAmount || null}, ${bill.ebePaidAmount || null}, ${bill.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        total_amount = EXCLUDED.total_amount,
        due_date = EXCLUDED.due_date,
        ire_paid = EXCLUDED.ire_paid,
        ebe_paid = EXCLUDED.ebe_paid,
        ire_paid_date = EXCLUDED.ire_paid_date,
        ebe_paid_date = EXCLUDED.ebe_paid_date,
        ire_paid_amount = EXCLUDED.ire_paid_amount,
        ebe_paid_amount = EXCLUDED.ebe_paid_amount;
    `;
  } catch (error) {
    console.error('Error saving bill to database:', error);
    throw error;
  }
}

// Delete a bill from database
export async function deleteBillFromDB(billId: string): Promise<void> {
  if (!sql) {
    throw new Error('Database not available');
  }
  try {
    await sql`DELETE FROM bills WHERE id = ${billId};`;
  } catch (error) {
    console.error('Error deleting bill from database:', error);
    throw error;
  }
}

