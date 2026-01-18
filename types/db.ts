export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          role: "admin" | "customer";
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: "admin" | "customer";
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "customer";
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          customer_id: string;
          platform:
            | "facebook"
            | "instagram"
            | "tiktok"
            | "youtube"
            | "threads"
            | "website";
          report_type:
            | "copyright"
            | "trademark"
            | "counterfeit"
            | "impersonator"
            | "other";
          status: "pending" | "approved" | "rejected";
          report_number: string | null;
          account_page_name: string;
          infringing_urls: string[];
          description: string | null;
          form_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          platform:
            | "facebook"
            | "instagram"
            | "tiktok"
            | "youtube"
            | "threads"
            | "website";
          report_type:
            | "copyright"
            | "trademark"
            | "counterfeit"
            | "impersonator"
            | "other";
          status?: "pending" | "approved" | "rejected";
          report_number?: string | null;
          account_page_name: string;
          infringing_urls: string[];
          description?: string | null;
          form_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          platform?:
            | "facebook"
            | "instagram"
            | "tiktok"
            | "youtube"
            | "threads"
            | "website";
          report_type?:
            | "copyright"
            | "trademark"
            | "counterfeit"
            | "impersonator"
            | "other";
          status?: "pending" | "approved" | "rejected";
          report_number?: string | null;
          account_page_name?: string;
          infringing_urls?: string[];
          description?: string | null;
          form_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_audit_logs: {
        Row: {
          id: string;
          report_id: string;
          actor_id: string;
          action: "created" | "approved" | "rejected" | "updated";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          actor_id: string;
          action: "created" | "approved" | "rejected" | "updated";
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          actor_id?: string;
          action?: "created" | "approved" | "rejected" | "updated";
          note?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportAuditLog =
  Database["public"]["Tables"]["report_audit_logs"]["Row"];
