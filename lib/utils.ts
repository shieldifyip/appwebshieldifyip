import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "threads", label: "Threads" },
  { value: "website", label: "Website" },
] as const;

export const REPORT_TYPE_OPTIONS = [
  { value: "copyright", label: "Copyright" },
  { value: "trademark", label: "Trademark" },
  { value: "counterfeit", label: "Counterfeit" },
  { value: "impersonator", label: "Impersonator" },
  { value: "other", label: "Other" },
] as const;

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;
