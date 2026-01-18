import { z } from "zod";

export const platformEnum = z.enum([
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "threads",
  "website",
]);

export const reportTypeEnum = z.enum([
  "copyright",
  "trademark",
  "counterfeit",
  "impersonator",
  "other",
]);

export const statusEnum = z.enum(["pending", "approved", "rejected"]);

const infringingUrlSchema = z
  .string()
  .url("Enter a valid URL")
  .trim()
  .min(1, "Required");

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .or(z.literal(""))
  .transform((val) => (val ? val : null));

const baseFields = {
  platform: platformEnum,
  report_type: reportTypeEnum,
  account_page_name: z.string().min(2, "Account/Page name is required"),
  infringing_urls: z
    .array(infringingUrlSchema)
    .min(1, "Add at least one URL")
    .max(50, "Limit 50 URLs"),
  description: z.string().max(2000).optional().or(z.literal("")),
};

const copyrightFields = z.object({
  report_type: z.literal("copyright"),
  platform: platformEnum,
  account_page_name: baseFields.account_page_name,
  infringing_urls: baseFields.infringing_urls,
  description: baseFields.description,
  work_description: z.string().min(2, "Describe the work"),
  proof_links: z
    .array(optionalUrl)
    .transform((arr) => arr.filter(Boolean) as string[])
    .optional()
    .default([]),
});

const trademarkFields = z.object({
  report_type: z.literal("trademark"),
  platform: platformEnum,
  account_page_name: baseFields.account_page_name,
  infringing_urls: baseFields.infringing_urls,
  description: baseFields.description,
  trademark_name: z.string().min(2, "Trademark name required"),
  registration_number: z.string().optional().or(z.literal("")),
  jurisdiction: z.string().optional().or(z.literal("")),
});

const counterfeitFields = z.object({
  report_type: z.literal("counterfeit"),
  platform: platformEnum,
  account_page_name: baseFields.account_page_name,
  infringing_urls: baseFields.infringing_urls,
  description: baseFields.description,
  brand: z.string().min(2, "Brand required"),
  product_type: z.string().optional().or(z.literal("")),
});

const impersonatorFields = z.object({
  report_type: z.literal("impersonator"),
  platform: platformEnum,
  account_page_name: baseFields.account_page_name,
  infringing_urls: baseFields.infringing_urls,
  description: baseFields.description,
  impersonated_entity: z.string().min(2, "Entity required"),
  evidence_links: z
    .array(optionalUrl)
    .transform((arr) => arr.filter(Boolean) as string[])
    .optional()
    .default([]),
});

const otherFields = z.object({
  report_type: z.literal("other"),
  platform: platformEnum,
  account_page_name: baseFields.account_page_name,
  infringing_urls: baseFields.infringing_urls,
  description: baseFields.description,
  other_details: z.string().min(2, "Please describe the issue"),
});

export const reportFormSchema = z.discriminatedUnion("report_type", [
  copyrightFields,
  trademarkFields,
  counterfeitFields,
  impersonatorFields,
  otherFields,
]);

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const approveSchema = z.object({
  report_number: z.string().min(2, "Report number is required"),
});

export const rejectSchema = z.object({
  note: z.string().max(1000).optional().or(z.literal("")),
});
