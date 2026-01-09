"use client";

import React, { useState } from "react";
import DepositModal from "./DepositModal";

export default function EarnYieldButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(true)}
        className="ml-3 inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Earn Yield
      </button>

      <DepositModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
