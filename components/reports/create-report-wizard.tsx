"use client";

/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, type UseFieldArrayReturn } from "react-hook-form";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLATFORM_OPTIONS, REPORT_TYPE_OPTIONS } from "@/lib/utils";
import {
  ReportFormValues,
  reportFormSchema,
} from "@/lib/validation/report";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface Props {
  customerId: string;
}

const MAX_URLS = 50;

const defaultValues = {
  platform: "facebook",
  report_type: "copyright",
  account_page_name: "",
  infringing_urls: [""],
  description: "",
  work_description: "",
  proof_links: [],
  trademark_name: "",
  registration_number: "",
  jurisdiction: "",
  brand: "",
  product_type: "",
  impersonated_entity: "",
  evidence_links: [],
  other_details: "",
} as unknown as ReportFormValues;

export function CreateReportWizard({ customerId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const platformFirstRef = useRef<HTMLButtonElement | null>(null);
  const typeFirstRef = useRef<HTMLButtonElement | null>(null);
  const accountRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(reportFormSchema) as any,
    defaultValues,
    mode: "onBlur",
  });

  const reportType = form.watch("report_type");

  const urlsArray = useFieldArray<any>({
    control: form.control,
    name: "infringing_urls" as any,
  });

  const proofLinksArray = useFieldArray<any>({
    control: form.control,
    name: "proof_links" as any,
  });

  const evidenceLinksArray = useFieldArray<any>({
    control: form.control,
    name: "evidence_links" as any,
  });

  const nextStep = async () => {
    if (step === 1) {
      const valid = await form.trigger("platform");
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await form.trigger("report_type");
      if (valid) setStep(3);
    }
  };

  const previousStep = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (values: ReportFormValues) => {
    setLoading(true);

    const sanitizedUrls = values.infringing_urls.filter((u) => u.trim().length > 0);

    const payload = buildPayload(values);

    const { data, error } = await (supabase.from("reports") as any)
      .insert({
        customer_id: customerId,
        platform: values.platform,
        report_type: values.report_type,
        account_page_name: values.account_page_name,
        infringing_urls: sanitizedUrls,
        description: values.description?.length ? values.description : null,
        form_payload: payload,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      toast({
        title: "Could not create report",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    if (!data?.id) {
      toast({
        title: "Report created but no ID returned",
        description: "Please refresh dashboard to view your report.",
      });
      router.push("/app");
      router.refresh();
      setLoading(false);
      return;
    }

    toast({
      title: "Report submitted",
      description: "Status is pending. Admin will assign a report number upon approval.",
    });
    router.push(`/app/reports/${data.id}`);
    router.refresh();
    setLoading(false);
  };

  useEffect(() => {
    if (step === 1 && platformFirstRef.current) {
      platformFirstRef.current.focus();
    } else if (step === 2 && typeFirstRef.current) {
      typeFirstRef.current.focus();
    } else if (step === 3 && accountRef.current) {
      accountRef.current.focus();
    }
  }, [step]);

  const stepTitle =
    step === 1
      ? "Select platform"
      : step === 2
        ? "Select report type"
        : "Provide details";

  return (
    <Form {...form}>
      <div className="mb-4 flex items-center gap-3 text-sm font-medium text-muted-foreground">
        <span className={`rounded-full px-3 py-1 ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</span>
        <span className={step === 1 ? "text-slate-900" : ""}>Platform</span>
        <span>&gt;</span>
        <span className={`rounded-full px-3 py-1 ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</span>
        <span className={step === 2 ? "text-slate-900" : ""}>Type</span>
        <span>&gt;</span>
        <span className={`rounded-full px-3 py-1 ${step === 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>3</span>
        <span className={step === 3 ? "text-slate-900" : ""}>Details</span>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{stepTitle}</h3>
            <p className="text-xs text-muted-foreground">
              Report number is assigned by admin on approval.
            </p>
          </div>
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {PLATFORM_OPTIONS.map((platform, index) => (
                <button
                  key={platform.value}
                  type="button"
                  className={`rounded-lg border p-4 text-left transition hover:border-primary hover:shadow ${
                    form.watch("platform") === platform.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                  ref={index === 0 ? platformFirstRef : undefined}
                  onClick={() =>
                    form.setValue("platform", platform.value as ReportFormValues["platform"])
                  }
                >
                  <p className="font-semibold capitalize">{platform.label}</p>
                  <p className="text-xs text-muted-foreground">Submit for {platform.label}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {REPORT_TYPE_OPTIONS.map((type, index) => (
                <button
                  key={type.value}
                  type="button"
                  className={`rounded-lg border p-4 text-left transition hover:border-primary hover:shadow ${
                    form.watch("report_type") === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                  ref={index === 0 ? typeFirstRef : undefined}
                  onClick={() =>
                    form.setValue("report_type", type.value as ReportFormValues["report_type"])
                  }
                >
                  <p className="font-semibold capitalize">{type.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Tailored questions for {type.label}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="account_page_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account / Page name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Offending account name"
                        ref={accountRef}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>
                  Infringing URLs <span className="text-xs text-muted-foreground">({urlsArray.fields.length}/{MAX_URLS})</span>
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Add every link that contains infringing content. Minimum one URL, maximum {MAX_URLS}.
                </p>
                {urlsArray.fields.map((field, index) => {
                  const urlError = (form.formState.errors as any)?.infringing_urls?.[index];
                  const message =
                    typeof urlError === "object" && urlError && "message" in urlError
                      ? (urlError as { message?: string }).message
                      : undefined;
                  return (
                    <FormItem key={field.id}>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...form.register(`infringing_urls.${index}` as const)}
                            placeholder="https://"
                            className={message ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => urlsArray.remove(index)}
                            disabled={urlsArray.fields.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage>{message}</FormMessage>
                    </FormItem>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => urlsArray.append("")}
                  disabled={urlsArray.fields.length >= MAX_URLS}
                >
                  Add URL ({urlsArray.fields.length}/{MAX_URLS})
                </Button>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share context to help admins review faster."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TypeSpecificFields
                reportType={reportType}
                form={form}
                proofLinksArray={proofLinksArray}
                evidenceLinksArray={evidenceLinksArray}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={previousStep}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit report"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function buildPayload(values: ReportFormValues) {
  switch (values.report_type) {
    case "copyright": {
      const proofLinks = values.proof_links ?? [];
      return {
        work_description: values.work_description,
        proof_links: proofLinks.filter((link) => link && link.trim().length),
      };
    }
    case "trademark":
      return {
        trademark_name: values.trademark_name,
        registration_number: values.registration_number || null,
        jurisdiction: values.jurisdiction || null,
      };
    case "counterfeit":
      return {
        brand: values.brand,
        product_type: values.product_type || null,
      };
    case "impersonator": {
      const evidenceLinks = values.evidence_links ?? [];
      return {
        impersonated_entity: values.impersonated_entity,
        evidence_links: evidenceLinks.filter((link) => link && link.trim().length),
      };
    }
    case "other":
      return {
        other_details: values.other_details,
      };
    default:
      return {};
  }
}

function TypeSpecificFields({
  reportType,
  form,
  proofLinksArray,
  evidenceLinksArray,
}: {
  reportType: ReportFormValues["report_type"];
  form: ReturnType<typeof useForm<any>>;
  proofLinksArray: UseFieldArrayReturn<any, any>;
  evidenceLinksArray: UseFieldArrayReturn<any, any>;
}) {
  if (reportType === "copyright") {
    return (
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="work_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe the original work</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="E.g., Our product photography and copy were copied verbatim."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <FormLabel>Proof links (optional)</FormLabel>
          {proofLinksArray.fields.map((field, index) => (
            <FormItem key={field.id}>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    {...form.register(`proof_links.${index}` as const)}
                    placeholder="https://"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => proofLinksArray.remove(index)}
                    disabled={proofLinksArray.fields.length === 0}
                  >
                    Remove
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => proofLinksArray.append("")}
            disabled={proofLinksArray.fields.length >= MAX_URLS}
          >
            Add proof link
          </Button>
        </div>
      </div>
    );
  }

  if (reportType === "trademark") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="trademark_name"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Trademark name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Registered mark name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="registration_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration number (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="US123456" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jurisdiction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jurisdiction (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="USPTO, EUIPO, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  if (reportType === "counterfeit") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Brand</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Brand being counterfeited" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_type"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Product type (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Shoes, accessories, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  if (reportType === "impersonator") {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="impersonated_entity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Who is being impersonated?</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Our brand / executive / entity" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <FormLabel>Evidence links (optional)</FormLabel>
          {evidenceLinksArray.fields.map((field, index) => (
            <FormItem key={field.id}>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    {...form.register(`evidence_links.${index}` as const)}
                    placeholder="https://"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => evidenceLinksArray.remove(index)}
                    disabled={evidenceLinksArray.fields.length === 0}
                  >
                    Remove
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => evidenceLinksArray.append("")}
            disabled={evidenceLinksArray.fields.length >= MAX_URLS}
          >
            Add evidence link
          </Button>
        </div>
      </div>
    );
  }

  if (reportType === "other") {
    return (
      <FormField
        control={form.control}
        name="other_details"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Details</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Describe the infringement. Include links or identifiers."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return null;
}
