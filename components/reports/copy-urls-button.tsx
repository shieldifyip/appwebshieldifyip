"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function CopyUrlsButton({ urls }: { urls: string[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Copied URLs to clipboard" });
    } catch (error) {
      console.error(error);
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access." });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={urls.length === 0}
      className="gap-2"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy all URLs"}
    </Button>
  );
}
