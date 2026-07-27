"use client";

import { useState } from "react";
import { Bookmark, Share2, Printer, Check } from "lucide-react";

export default function DetailActions({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed share sheet */
    }
  };

  return (
    <div className="mt-6 flex items-center gap-2 border-b border-gray-100 pb-5">
      <button
        onClick={() => setSaved((s) => !s)}
        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
          saved ? "bg-blue-100 text-blue-800" : "bg-blue-800 text-white hover:bg-blue-900"
        }`}
      >
        {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {saved ? "Saved" : "Save"}
      </button>
      <button
        onClick={share}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-50"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Share"}
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-50"
      >
        <Printer className="h-4 w-4" /> Print
      </button>
    </div>
  );
}
