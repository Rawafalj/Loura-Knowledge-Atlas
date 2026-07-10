export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_events: {
        Row: {
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
          actor_user_id: string | null;
          after_summary: Json | null;
          before_summary: Json | null;
          created_at: string;
          event_type: string;
          id: string;
          object_id: string;
          object_type: string;
          request_id: string | null;
          source_proposal_item_id: string | null;
          summary: string;
          workspace_id: string;
        };
        Insert: {
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
          actor_user_id?: string | null;
          after_summary?: Json | null;
          before_summary?: Json | null;
          created_at?: string;
          event_type: string;
          id?: string;
          object_id: string;
          object_type: string;
          request_id?: string | null;
          source_proposal_item_id?: string | null;
          summary: string;
          workspace_id: string;
        };
        Update: {
          actor_type?: Database["public"]["Enums"]["audit_actor_type"];
          actor_user_id?: string | null;
          after_summary?: Json | null;
          before_summary?: Json | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          object_id?: string;
          object_type?: string;
          request_id?: string | null;
          source_proposal_item_id?: string | null;
          summary?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_profile_fk";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_events_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_aliases: {
        Row: {
          alias: string;
          alias_normalized: string;
          alias_type: Database["public"]["Enums"]["alias_type"];
          concept_id: string;
          created_at: string;
          disambiguation_key: string | null;
          id: string;
          language_code: string;
          workspace_id: string;
        };
        Insert: {
          alias: string;
          alias_normalized: string;
          alias_type?: Database["public"]["Enums"]["alias_type"];
          concept_id: string;
          created_at?: string;
          disambiguation_key?: string | null;
          id?: string;
          language_code?: string;
          workspace_id: string;
        };
        Update: {
          alias?: string;
          alias_normalized?: string;
          alias_type?: Database["public"]["Enums"]["alias_type"];
          concept_id?: string;
          created_at?: string;
          disambiguation_key?: string | null;
          id?: string;
          language_code?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concept_aliases_concept_workspace_fk";
            columns: ["concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concept_aliases_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_relations: {
        Row: {
          confidence: number | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          provenance_type: Database["public"]["Enums"]["relation_provenance"];
          relation_type_id: string;
          review_status: Database["public"]["Enums"]["content_status"];
          reviewed_by: string | null;
          source_concept_id: string;
          source_proposal_item_id: string | null;
          target_concept_id: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          provenance_type?: Database["public"]["Enums"]["relation_provenance"];
          relation_type_id: string;
          review_status?: Database["public"]["Enums"]["content_status"];
          reviewed_by?: string | null;
          source_concept_id: string;
          source_proposal_item_id?: string | null;
          target_concept_id: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          provenance_type?: Database["public"]["Enums"]["relation_provenance"];
          relation_type_id?: string;
          review_status?: Database["public"]["Enums"]["content_status"];
          reviewed_by?: string | null;
          source_concept_id?: string;
          source_proposal_item_id?: string | null;
          target_concept_id?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concept_relations_created_by_profile_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concept_relations_reviewed_by_profile_fk";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concept_relations_source_workspace_fk";
            columns: ["source_concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concept_relations_target_workspace_fk";
            columns: ["target_concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concept_relations_type_workspace_fk";
            columns: ["relation_type_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "relation_types";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concept_relations_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_revisions: {
        Row: {
          change_source: Database["public"]["Enums"]["revision_change_source"];
          change_summary: string;
          concept_id: string;
          created_at: string;
          created_by: string;
          id: string;
          proposal_item_id: string | null;
          revision_number: number;
          snapshot: Json;
          workspace_id: string;
        };
        Insert: {
          change_source: Database["public"]["Enums"]["revision_change_source"];
          change_summary: string;
          concept_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          proposal_item_id?: string | null;
          revision_number: number;
          snapshot: Json;
          workspace_id: string;
        };
        Update: {
          change_source?: Database["public"]["Enums"]["revision_change_source"];
          change_summary?: string;
          concept_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          proposal_item_id?: string | null;
          revision_number?: number;
          snapshot?: Json;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concept_revisions_concept_workspace_fk";
            columns: ["concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concept_revisions_created_by_profile_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concept_revisions_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      concepts: {
        Row: {
          canonical_domain_id: string;
          canonical_name: string;
          canonical_parent_id: string | null;
          common_confusions_markdown: string | null;
          concept_kind: Database["public"]["Enums"]["concept_kind"];
          concise_definition: string;
          content_status: Database["public"]["Enums"]["content_status"];
          counterexamples_markdown: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          examples_markdown: string | null;
          failure_modes_markdown: string | null;
          id: string;
          last_reviewed_at: string | null;
          mechanism_markdown: string | null;
          priority: Database["public"]["Enums"]["content_priority"];
          replacement_concept_id: string | null;
          review_note: string | null;
          slug: string;
          synthesis_markdown: string;
          target_mastery: number | null;
          updated_at: string;
          updated_by: string;
          why_it_exists_markdown: string | null;
          workspace_id: string;
        };
        Insert: {
          canonical_domain_id: string;
          canonical_name: string;
          canonical_parent_id?: string | null;
          common_confusions_markdown?: string | null;
          concept_kind?: Database["public"]["Enums"]["concept_kind"];
          concise_definition?: string;
          content_status?: Database["public"]["Enums"]["content_status"];
          counterexamples_markdown?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          examples_markdown?: string | null;
          failure_modes_markdown?: string | null;
          id?: string;
          last_reviewed_at?: string | null;
          mechanism_markdown?: string | null;
          priority?: Database["public"]["Enums"]["content_priority"];
          replacement_concept_id?: string | null;
          review_note?: string | null;
          slug: string;
          synthesis_markdown?: string;
          target_mastery?: number | null;
          updated_at?: string;
          updated_by: string;
          why_it_exists_markdown?: string | null;
          workspace_id: string;
        };
        Update: {
          canonical_domain_id?: string;
          canonical_name?: string;
          canonical_parent_id?: string | null;
          common_confusions_markdown?: string | null;
          concept_kind?: Database["public"]["Enums"]["concept_kind"];
          concise_definition?: string;
          content_status?: Database["public"]["Enums"]["content_status"];
          counterexamples_markdown?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          examples_markdown?: string | null;
          failure_modes_markdown?: string | null;
          id?: string;
          last_reviewed_at?: string | null;
          mechanism_markdown?: string | null;
          priority?: Database["public"]["Enums"]["content_priority"];
          replacement_concept_id?: string | null;
          review_note?: string | null;
          slug?: string;
          synthesis_markdown?: string;
          target_mastery?: number | null;
          updated_at?: string;
          updated_by?: string;
          why_it_exists_markdown?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concepts_canonical_parent_id_concepts_id_fk";
            columns: ["canonical_parent_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concepts_created_by_profile_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concepts_domain_workspace_fk";
            columns: ["canonical_domain_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concepts_parent_workspace_fk";
            columns: ["canonical_parent_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concepts_replacement_concept_id_concepts_id_fk";
            columns: ["replacement_concept_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concepts_replacement_workspace_fk";
            columns: ["replacement_concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "concepts_updated_by_profile_fk";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concepts_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      domains: {
        Row: {
          content_status: Database["public"]["Enums"]["content_status"];
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          id: string;
          kind: Database["public"]["Enums"]["domain_kind"];
          last_reviewed_at: string | null;
          parent_domain_id: string | null;
          priority: Database["public"]["Enums"]["content_priority"];
          scope_markdown: string;
          short_description: string;
          slug: string;
          sort_order: number;
          target_mastery: number | null;
          title: string;
          updated_at: string;
          updated_by: string;
          workspace_id: string;
        };
        Insert: {
          content_status?: Database["public"]["Enums"]["content_status"];
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["domain_kind"];
          last_reviewed_at?: string | null;
          parent_domain_id?: string | null;
          priority?: Database["public"]["Enums"]["content_priority"];
          scope_markdown?: string;
          short_description: string;
          slug: string;
          sort_order?: number;
          target_mastery?: number | null;
          title: string;
          updated_at?: string;
          updated_by: string;
          workspace_id: string;
        };
        Update: {
          content_status?: Database["public"]["Enums"]["content_status"];
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["domain_kind"];
          last_reviewed_at?: string | null;
          parent_domain_id?: string | null;
          priority?: Database["public"]["Enums"]["content_priority"];
          scope_markdown?: string;
          short_description?: string;
          slug?: string;
          sort_order?: number;
          target_mastery?: number | null;
          title?: string;
          updated_at?: string;
          updated_by?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "domains_created_by_profile_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domains_parent_domain_id_domains_id_fk";
            columns: ["parent_domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domains_parent_workspace_fk";
            columns: ["parent_domain_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "domains_updated_by_profile_fk";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domains_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      relation_types: {
        Row: {
          acyclic: boolean;
          allowed_source_kinds: string[];
          allowed_target_kinds: string[];
          allows_self: boolean;
          category: Database["public"]["Enums"]["relation_category"];
          created_at: string;
          directed: boolean;
          forward_label: string;
          id: string;
          inverse_label: string;
          is_system: boolean;
          key: string;
          style: Json;
          symmetric: boolean;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          acyclic?: boolean;
          allowed_source_kinds?: string[];
          allowed_target_kinds?: string[];
          allows_self?: boolean;
          category: Database["public"]["Enums"]["relation_category"];
          created_at?: string;
          directed: boolean;
          forward_label: string;
          id?: string;
          inverse_label: string;
          is_system?: boolean;
          key: string;
          style?: Json;
          symmetric?: boolean;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          acyclic?: boolean;
          allowed_source_kinds?: string[];
          allowed_target_kinds?: string[];
          allows_self?: boolean;
          category?: Database["public"]["Enums"]["relation_category"];
          created_at?: string;
          directed?: boolean;
          forward_label?: string;
          id?: string;
          inverse_label?: string;
          is_system?: boolean;
          key?: string;
          style?: Json;
          symmetric?: boolean;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "relation_types_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          settings: Json;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          settings?: Json;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          settings?: Json;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_profiles_id_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bootstrap_workspace: {
        Args: { p_name: string; p_seed?: Json; p_slug: string };
        Returns: string;
      };
      concept_snapshot: {
        Args: { p_concept_id: string };
        Returns: Json;
      };
      create_atlas_concept: {
        Args: {
          p_change_summary: string;
          p_payload: Json;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      create_atlas_relation: {
        Args: {
          p_description: string;
          p_relation_type_id: string;
          p_review_status: Database["public"]["Enums"]["content_status"];
          p_source_concept_id: string;
          p_target_concept_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      install_atlas_seed: {
        Args: { p_seed: Json; p_workspace_id: string };
        Returns: Json;
      };
      is_workspace_member: {
        Args: { allowed_roles?: string[]; workspace_uuid: string };
        Returns: boolean;
      };
      normalize_alias_text: { Args: { alias_value: string }; Returns: string };
      record_audit_event: {
        Args: {
          p_after_summary?: Json;
          p_before_summary?: Json;
          p_event_type: string;
          p_object_id: string;
          p_object_type: string;
          p_request_id?: string;
          p_summary: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      shares_workspace_with: {
        Args: { profile_uuid: string };
        Returns: boolean;
      };
      remove_atlas_relation: {
        Args: {
          p_expected_updated_at: string;
          p_relation_id: string;
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      replace_concept_aliases: {
        Args: {
          p_aliases: Json;
          p_concept_id: string;
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      update_atlas_concept: {
        Args: {
          p_change_summary: string;
          p_concept_id: string;
          p_expected_updated_at: string;
          p_payload: Json;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      update_atlas_relation: {
        Args: {
          p_description: string;
          p_expected_updated_at: string;
          p_relation_id: string;
          p_relation_type_id: string;
          p_review_status: Database["public"]["Enums"]["content_status"];
          p_source_concept_id: string;
          p_target_concept_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      alias_type:
        | "synonym"
        | "abbreviation"
        | "former_name"
        | "translation"
        | "common_misnomer";
      audit_actor_type: "user" | "worker" | "system";
      concept_kind:
        | "concept"
        | "theory"
        | "mechanism"
        | "method"
        | "standard"
        | "model"
        | "tool";
      content_priority: "now" | "next" | "later" | "reference";
      content_status: "draft" | "reviewed" | "deprecated";
      domain_kind: "root" | "core" | "overlay";
      relation_category:
        | "hierarchy"
        | "learning"
        | "explanatory"
        | "contrast"
        | "operational"
        | "application"
        | "epistemic";
      relation_provenance: "human" | "source_extracted" | "inferred";
      revision_change_source: "manual" | "proposal" | "import" | "restore";
      workspace_role: "owner" | "editor" | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      alias_type: [
        "synonym",
        "abbreviation",
        "former_name",
        "translation",
        "common_misnomer",
      ],
      audit_actor_type: ["user", "worker", "system"],
      concept_kind: [
        "concept",
        "theory",
        "mechanism",
        "method",
        "standard",
        "model",
        "tool",
      ],
      content_priority: ["now", "next", "later", "reference"],
      content_status: ["draft", "reviewed", "deprecated"],
      domain_kind: ["root", "core", "overlay"],
      relation_category: [
        "hierarchy",
        "learning",
        "explanatory",
        "contrast",
        "operational",
        "application",
        "epistemic",
      ],
      relation_provenance: ["human", "source_extracted", "inferred"],
      revision_change_source: ["manual", "proposal", "import", "restore"],
      workspace_role: ["owner", "editor", "viewer"],
    },
  },
} as const;
