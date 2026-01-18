"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Copied link" });
    } catch (err) {
      console.error(err);
      toast({ title: "Copy failed", description: "Clipboard permission blocked." });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
