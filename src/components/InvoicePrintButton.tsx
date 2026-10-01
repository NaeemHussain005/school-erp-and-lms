"use client";

import { Printer } from "lucide-react";

export default function InvoicePrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary">
      <Printer className="w-4 h-4" /> Print
    </button>
  );
}
