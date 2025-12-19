# Finance Splitter

A simple, elegant web application for tracking and splitting household bills 50/50 between flatmates Ire and Ebe.

## Features

- ✅ Add bills (rent, water, electricity, etc.) with total amount and due date
- ✅ Automatic 50/50 split calculation
- ✅ Individual payment tracking - mark when Ire or Ebe has paid their share
- ✅ Payment date tracking - see when each person paid
- ✅ Overdue bill indicators
- ✅ Summary dashboard showing payment status and outstanding amounts
- ✅ Beautiful, modern UI with dark mode support
- ✅ Local storage persistence (no backend needed)

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern, utility-first styling
- **date-fns** - Date formatting utilities

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

This app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Vercel will automatically detect Next.js and configure everything
5. Click "Deploy" and you're done!

Alternatively, you can use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Usage

1. **Add a bill**: Enter the bill name (e.g., "Rent", "Electricity"), total amount, and due date
2. **Track payments**: Click the checkmark buttons to mark when Ire or Ebe has paid their share
3. **View summary**: The summary card shows total bills, payment status, and outstanding amounts
4. **Monitor due dates**: Bills are color-coded - red for overdue, green for fully paid
5. **Delete bills**: Remove bills you no longer need

## Data Storage

Currently uses browser localStorage, so data persists in your browser. For shared access between devices, consider adding a backend or database in the future.

## Future Enhancements

- User authentication
- Cloud database for multi-device access
- Export to CSV/PDF
- Categories and tags
- Recurring expenses
- Payment settlement tracking
# finance
# finance
