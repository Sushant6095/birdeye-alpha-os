"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      richColors
      closeButton
      duration={5500}
      toastOptions={{
        style: {
          background: "hsl(220 13% 6%)",
          border: "1px solid hsl(220 13% 14%)",
          color: "hsl(210 20% 98%)",
        },
        classNames: {
          error:
            "!border-red-500/40 !bg-[hsl(0_60%_8%)] !text-red-100",
          success:
            "!border-emerald-400/40 !bg-[hsl(150_60%_8%)] !text-emerald-100",
          warning:
            "!border-amber-400/40 !bg-[hsl(40_60%_8%)] !text-amber-100",
          info:
            "!border-sky-400/40 !bg-[hsl(210_60%_8%)] !text-sky-100",
          title: "!font-semibold !tracking-tight",
          description: "!text-xs !opacity-80",
          actionButton: "!bg-emerald-400 !text-black",
        },
      }}
    />
  );
}
