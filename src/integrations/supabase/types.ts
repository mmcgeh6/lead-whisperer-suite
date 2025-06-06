export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          apifyapolloapikey: string | null
          apolloapikey: string | null
          awards_webhook: string | null
          companyenrichmentwebhook: string | null
          companyresearchwebhook: string | null
          content_webhook: string | null
          created_at: string | null
          crm_export_webhook: string | null
          emailfinderwebhook: string | null
          facebook_ads_webhook: string | null
          growthresearchwebhook: string | null
          id: string
          ideal_customer_webhook: string | null
          jobs_webhook: string | null
          lead_search_webhook: string | null
          leadprovider: string | null
          linkedinenrichmentwebhook: string | null
          marketresearchwebhook: string | null
          outreach_webhook: string | null
          profile_research_webhook: string | null
          tech_stack_webhook: string | null
          techresearchwebhook: string | null
          updated_at: string | null
        }
        Insert: {
          apifyapolloapikey?: string | null
          apolloapikey?: string | null
          awards_webhook?: string | null
          companyenrichmentwebhook?: string | null
          companyresearchwebhook?: string | null
          content_webhook?: string | null
          created_at?: string | null
          crm_export_webhook?: string | null
          emailfinderwebhook?: string | null
          facebook_ads_webhook?: string | null
          growthresearchwebhook?: string | null
          id: string
          ideal_customer_webhook?: string | null
          jobs_webhook?: string | null
          lead_search_webhook?: string | null
          leadprovider?: string | null
          linkedinenrichmentwebhook?: string | null
          marketresearchwebhook?: string | null
          outreach_webhook?: string | null
          profile_research_webhook?: string | null
          tech_stack_webhook?: string | null
          techresearchwebhook?: string | null
          updated_at?: string | null
        }
        Update: {
          apifyapolloapikey?: string | null
          apolloapikey?: string | null
          awards_webhook?: string | null
          companyenrichmentwebhook?: string | null
          companyresearchwebhook?: string | null
          content_webhook?: string | null
          created_at?: string | null
          crm_export_webhook?: string | null
          emailfinderwebhook?: string | null
          facebook_ads_webhook?: string | null
          growthresearchwebhook?: string | null
          id?: string
          ideal_customer_webhook?: string | null
          jobs_webhook?: string | null
          lead_search_webhook?: string | null
          leadprovider?: string | null
          linkedinenrichmentwebhook?: string | null
          marketresearchwebhook?: string | null
          outreach_webhook?: string | null
          profile_research_webhook?: string | null
          tech_stack_webhook?: string | null
          techresearchwebhook?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          annual_revenue: number | null
          annual_revenue_printed: string | null
          call_script: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email_script: string | null
          estimated_num_employees: number | null
          external_id: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          industry: string | null
          industry_vertical: string | null
          keywords: string[] | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          primary_domain: string | null
          raw_address: string | null
          research_notes: string | null
          size: string | null
          social_dm_script: string | null
          state: string | null
          street: string | null
          tags: string[] | null
          tech_stack_data: Json | null
          tech_stack_last_updated: string | null
          technology_names: string[] | null
          text_script: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          annual_revenue?: number | null
          annual_revenue_printed?: string | null
          call_script?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email_script?: string | null
          estimated_num_employees?: number | null
          external_id?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          industry_vertical?: string | null
          keywords?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_domain?: string | null
          raw_address?: string | null
          research_notes?: string | null
          size?: string | null
          social_dm_script?: string | null
          state?: string | null
          street?: string | null
          tags?: string[] | null
          tech_stack_data?: Json | null
          tech_stack_last_updated?: string | null
          technology_names?: string[] | null
          text_script?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          annual_revenue?: number | null
          annual_revenue_printed?: string | null
          call_script?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email_script?: string | null
          estimated_num_employees?: number | null
          external_id?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          industry_vertical?: string | null
          keywords?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_domain?: string | null
          raw_address?: string | null
          research_notes?: string | null
          size?: string | null
          social_dm_script?: string | null
          state?: string | null
          street?: string | null
          tags?: string[] | null
          tech_stack_data?: Json | null
          tech_stack_last_updated?: string | null
          technology_names?: string[] | null
          text_script?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      company_insights: {
        Row: {
          ad_details: string | null
          approach_notes: string | null
          awards: string[] | null
          company_id: string
          content_audit: Json | null
          created_at: string
          id: string
          ideal_client: boolean | null
          ideal_customer_analysis: string | null
          job_postings: Json | null
          notes: string | null
          profile_research: string | null
          running_facebook_ads: boolean | null
          suggested_approach: string | null
          tech_stack_data: Json | null
          tech_stack_last_updated: string | null
          updated_at: string
        }
        Insert: {
          ad_details?: string | null
          approach_notes?: string | null
          awards?: string[] | null
          company_id: string
          content_audit?: Json | null
          created_at?: string
          id?: string
          ideal_client?: boolean | null
          ideal_customer_analysis?: string | null
          job_postings?: Json | null
          notes?: string | null
          profile_research?: string | null
          running_facebook_ads?: boolean | null
          suggested_approach?: string | null
          tech_stack_data?: Json | null
          tech_stack_last_updated?: string | null
          updated_at?: string
        }
        Update: {
          ad_details?: string | null
          approach_notes?: string | null
          awards?: string[] | null
          company_id?: string
          content_audit?: Json | null
          created_at?: string
          id?: string
          ideal_client?: boolean | null
          ideal_customer_analysis?: string | null
          job_postings?: Json | null
          notes?: string | null
          profile_research?: string | null
          running_facebook_ads?: boolean | null
          suggested_approach?: string | null
          tech_stack_data?: Json | null
          tech_stack_last_updated?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          about: string | null
          address: string | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          email: string | null
          email_status: string | null
          external_id: string | null
          facebook_url: string | null
          first_name: string
          headline: string | null
          id: string
          job_history: string[] | null
          job_start_date: string | null
          languages: string | null
          last_enriched: string | null
          last_name: string
          linkedin_bio: string | null
          linkedin_education: string[] | null
          linkedin_experience: string[] | null
          linkedin_posts: Json | null
          linkedin_skills: string[] | null
          linkedin_url: string | null
          mobile_phone: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          position: string | null
          seniority: string | null
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          address?: string | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          email?: string | null
          email_status?: string | null
          external_id?: string | null
          facebook_url?: string | null
          first_name: string
          headline?: string | null
          id?: string
          job_history?: string[] | null
          job_start_date?: string | null
          languages?: string | null
          last_enriched?: string | null
          last_name: string
          linkedin_bio?: string | null
          linkedin_education?: string[] | null
          linkedin_experience?: string[] | null
          linkedin_posts?: Json | null
          linkedin_skills?: string[] | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          seniority?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          address?: string | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          email?: string | null
          email_status?: string | null
          external_id?: string | null
          facebook_url?: string | null
          first_name?: string
          headline?: string | null
          id?: string
          job_history?: string[] | null
          job_start_date?: string | null
          languages?: string | null
          last_enriched?: string | null
          last_name?: string
          linkedin_bio?: string | null
          linkedin_education?: string[] | null
          linkedin_experience?: string[] | null
          linkedin_posts?: Json | null
          linkedin_skills?: string[] | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          seniority?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      list_companies: {
        Row: {
          added_at: string
          company_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          company_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string
          company_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_companies_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_companies_new: {
        Row: {
          added_at: string | null
          company_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string | null
          company_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string | null
          company_id?: string
          id?: string
          list_id?: string
        }
        Relationships: []
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          id: string
          person_titles: string[] | null
          result_count: number
          search_date: string | null
          search_params: Json
          search_type: string
          user_id: string | null
        }
        Insert: {
          id?: string
          person_titles?: string[] | null
          result_count?: number
          search_date?: string | null
          search_params: Json
          search_type: string
          user_id?: string | null
        }
        Update: {
          id?: string
          person_titles?: string[] | null
          result_count?: number
          search_date?: string | null
          search_params?: Json
          search_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      search_results_archive: {
        Row: {
          added_to_list: boolean | null
          created_at: string | null
          id: string
          result_data: Json
          search_id: string | null
          unique_identifier: string
        }
        Insert: {
          added_to_list?: boolean | null
          created_at?: string | null
          id?: string
          result_data: Json
          search_id?: string | null
          unique_identifier: string
        }
        Update: {
          added_to_list?: boolean | null
          created_at?: string | null
          id?: string
          result_data?: Json
          search_id?: string | null
          unique_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_results_archive_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "search_history"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
