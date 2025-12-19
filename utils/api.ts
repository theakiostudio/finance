import { Bill } from "@/types/expense";

const API_BASE = "/api/bills";

export async function fetchBills(): Promise<Bill[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error("Failed to fetch bills");
  }
  return response.json();
}

export async function createBill(bill: Bill): Promise<Bill> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bill),
  });
  if (!response.ok) {
    throw new Error("Failed to create bill");
  }
  return response.json();
}

export async function updateBill(bill: Bill): Promise<Bill> {
  const response = await fetch(API_BASE, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bill),
  });
  if (!response.ok) {
    throw new Error("Failed to update bill");
  }
  return response.json();
}

export async function deleteBill(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete bill");
  }
}

