export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
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
            foreignKeyName: "audit_events_actor_user_id_profiles_id_fk";
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
            foreignKeyName: "concept_relations_created_by_profiles_id_fk";
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
            foreignKeyName: "concept_relations_reviewed_by_profiles_id_fk";
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
            foreignKeyName: "concept_revisions_created_by_profiles_id_fk";
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
          embedding: string | null;
          embedding_model: string | null;
          embedding_updated_at: string | null;
          examples_markdown: string | null;
          failure_modes_markdown: string | null;
          id: string;
          last_reviewed_at: string | null;
          mechanism_markdown: string | null;
          priority: Database["public"]["Enums"]["content_priority"];
          replacement_concept_id: string | null;
          review_note: string | null;
          search_document: unknown;
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
          embedding?: string | null;
          embedding_model?: string | null;
          embedding_updated_at?: string | null;
          examples_markdown?: string | null;
          failure_modes_markdown?: string | null;
          id?: string;
          last_reviewed_at?: string | null;
          mechanism_markdown?: string | null;
          priority?: Database["public"]["Enums"]["content_priority"];
          replacement_concept_id?: string | null;
          review_note?: string | null;
          search_document?: unknown;
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
          embedding?: string | null;
          embedding_model?: string | null;
          embedding_updated_at?: string | null;
          examples_markdown?: string | null;
          failure_modes_markdown?: string | null;
          id?: string;
          last_reviewed_at?: string | null;
          mechanism_markdown?: string | null;
          priority?: Database["public"]["Enums"]["content_priority"];
          replacement_concept_id?: string | null;
          review_note?: string | null;
          search_document?: unknown;
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
            foreignKeyName: "concepts_created_by_profiles_id_fk";
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
            foreignKeyName: "concepts_updated_by_profiles_id_fk";
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
            foreignKeyName: "domains_created_by_profiles_id_fk";
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
            foreignKeyName: "domains_updated_by_profiles_id_fk";
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
      ingestion_jobs: {
        Row: {
          allow_external_ai: boolean;
          attempt_count: number;
          completed_at: string | null;
          created_at: string;
          error_code: string | null;
          error_message_sanitized: string | null;
          extraction_schema_version: string;
          force_reprocess: boolean;
          id: string;
          idempotency_key: string;
          parser_profile: string;
          progress: number;
          queue_message_id: number | null;
          requested_by: string;
          source_id: string;
          source_version_id: string | null;
          stage: Database["public"]["Enums"]["ingestion_stage"];
          started_at: string | null;
          status: Database["public"]["Enums"]["ingestion_job_status"];
          workspace_id: string;
        };
        Insert: {
          allow_external_ai?: boolean;
          attempt_count?: number;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          error_message_sanitized?: string | null;
          extraction_schema_version: string;
          force_reprocess?: boolean;
          id?: string;
          idempotency_key: string;
          parser_profile: string;
          progress?: number;
          queue_message_id?: number | null;
          requested_by: string;
          source_id: string;
          source_version_id?: string | null;
          stage?: Database["public"]["Enums"]["ingestion_stage"];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ingestion_job_status"];
          workspace_id: string;
        };
        Update: {
          allow_external_ai?: boolean;
          attempt_count?: number;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          error_message_sanitized?: string | null;
          extraction_schema_version?: string;
          force_reprocess?: boolean;
          id?: string;
          idempotency_key?: string;
          parser_profile?: string;
          progress?: number;
          queue_message_id?: number | null;
          requested_by?: string;
          source_id?: string;
          source_version_id?: string | null;
          stage?: Database["public"]["Enums"]["ingestion_stage"];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ingestion_job_status"];
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_requested_by_profiles_id_fk";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_source_workspace_fk";
            columns: ["source_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "ingestion_jobs_version_workspace_fk";
            columns: ["source_version_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "source_versions";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "ingestion_jobs_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_path_steps: {
        Row: {
          branch_key: string;
          concept_id: string;
          created_at: string;
          exercise_markdown: string | null;
          id: string;
          learning_objective: string | null;
          learning_path_id: string;
          mandatory: boolean;
          rationale: string | null;
          required_prior_mastery: number;
          step_order: number;
          target_mastery: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          branch_key?: string;
          concept_id: string;
          created_at?: string;
          exercise_markdown?: string | null;
          id?: string;
          learning_objective?: string | null;
          learning_path_id: string;
          mandatory?: boolean;
          rationale?: string | null;
          required_prior_mastery?: number;
          step_order: number;
          target_mastery: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          branch_key?: string;
          concept_id?: string;
          created_at?: string;
          exercise_markdown?: string | null;
          id?: string;
          learning_objective?: string | null;
          learning_path_id?: string;
          mandatory?: boolean;
          rationale?: string | null;
          required_prior_mastery?: number;
          step_order?: number;
          target_mastery?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_path_steps_concept_workspace_fk";
            columns: ["concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "learning_path_steps_path_workspace_fk";
            columns: ["learning_path_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "learning_paths";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "learning_path_steps_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_paths: {
        Row: {
          content_status: Database["public"]["Enums"]["content_status"];
          created_at: string;
          created_by: string;
          id: string;
          purpose_markdown: string;
          slug: string;
          target_outcome_markdown: string;
          title: string;
          updated_at: string;
          updated_by: string;
          workspace_id: string;
        };
        Insert: {
          content_status?: Database["public"]["Enums"]["content_status"];
          created_at?: string;
          created_by: string;
          id?: string;
          purpose_markdown?: string;
          slug: string;
          target_outcome_markdown?: string;
          title: string;
          updated_at?: string;
          updated_by: string;
          workspace_id: string;
        };
        Update: {
          content_status?: Database["public"]["Enums"]["content_status"];
          created_at?: string;
          created_by?: string;
          id?: string;
          purpose_markdown?: string;
          slug?: string;
          target_outcome_markdown?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_paths_created_by_profiles_id_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_paths_updated_by_profiles_id_fk";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_paths_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_prerequisite_waivers: {
        Row: {
          created_at: string;
          id: string;
          learning_path_id: string;
          prerequisite_concept_id: string;
          reason: string;
          target_concept_id: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          learning_path_id: string;
          prerequisite_concept_id: string;
          reason: string;
          target_concept_id: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          learning_path_id?: string;
          prerequisite_concept_id?: string;
          reason?: string;
          target_concept_id?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_prerequisite_waivers_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_prerequisite_waivers_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_waivers_path_workspace_fk";
            columns: ["learning_path_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "learning_paths";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "learning_waivers_prerequisite_workspace_fk";
            columns: ["prerequisite_concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "learning_waivers_target_workspace_fk";
            columns: ["target_concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
        ];
      };
      mastery_evidence: {
        Row: {
          ai_assessment: Json | null;
          artifact_url: string | null;
          concept_id: string;
          created_at: string;
          evidence_type: Database["public"]["Enums"]["mastery_evidence_type"];
          id: string;
          level_claimed: number;
          note: string | null;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          ai_assessment?: Json | null;
          artifact_url?: string | null;
          concept_id: string;
          created_at?: string;
          evidence_type: Database["public"]["Enums"]["mastery_evidence_type"];
          id?: string;
          level_claimed: number;
          note?: string | null;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          ai_assessment?: Json | null;
          artifact_url?: string | null;
          concept_id?: string;
          created_at?: string;
          evidence_type?: Database["public"]["Enums"]["mastery_evidence_type"];
          id?: string;
          level_claimed?: number;
          note?: string | null;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mastery_evidence_concept_workspace_fk";
            columns: ["concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "mastery_evidence_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mastery_evidence_workspace_id_workspaces_id_fk";
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
      source_segments: {
        Row: {
          created_at: string;
          embedding: string | null;
          embedding_model: string | null;
          heading_path: string[];
          id: string;
          ordinal: number;
          page_end: number | null;
          page_start: number | null;
          provenance: Json;
          search_document: unknown;
          segment_type: Database["public"]["Enums"]["source_segment_type"];
          source_version_id: string;
          stable_key: string;
          text: string;
          token_count: number;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          embedding?: string | null;
          embedding_model?: string | null;
          heading_path?: string[];
          id?: string;
          ordinal: number;
          page_end?: number | null;
          page_start?: number | null;
          provenance?: Json;
          search_document?: unknown;
          segment_type: Database["public"]["Enums"]["source_segment_type"];
          source_version_id: string;
          stable_key: string;
          text: string;
          token_count: number;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          embedding?: string | null;
          embedding_model?: string | null;
          heading_path?: string[];
          id?: string;
          ordinal?: number;
          page_end?: number | null;
          page_start?: number | null;
          provenance?: Json;
          search_document?: unknown;
          segment_type?: Database["public"]["Enums"]["source_segment_type"];
          source_version_id?: string;
          stable_key?: string;
          text?: string;
          token_count?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_segments_version_workspace_fk";
            columns: ["source_version_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "source_versions";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "source_segments_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      source_versions: {
        Row: {
          completed_at: string | null;
          created_at: string;
          docling_json_path: string | null;
          error_code: string | null;
          error_message_sanitized: string | null;
          extracted_metadata: Json;
          file_checksum_sha256: string;
          id: string;
          idempotency_key: string;
          language_code: string | null;
          markdown_path: string | null;
          page_count: number | null;
          parser_name: string;
          parser_profile: string;
          parser_version: string;
          processing_status: Database["public"]["Enums"]["source_version_status"];
          source_id: string;
          version_number: number;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          docling_json_path?: string | null;
          error_code?: string | null;
          error_message_sanitized?: string | null;
          extracted_metadata?: Json;
          file_checksum_sha256: string;
          id?: string;
          idempotency_key: string;
          language_code?: string | null;
          markdown_path?: string | null;
          page_count?: number | null;
          parser_name: string;
          parser_profile: string;
          parser_version: string;
          processing_status?: Database["public"]["Enums"]["source_version_status"];
          source_id: string;
          version_number: number;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          docling_json_path?: string | null;
          error_code?: string | null;
          error_message_sanitized?: string | null;
          extracted_metadata?: Json;
          file_checksum_sha256?: string;
          id?: string;
          idempotency_key?: string;
          language_code?: string | null;
          markdown_path?: string | null;
          page_count?: number | null;
          parser_name?: string;
          parser_profile?: string;
          parser_version?: string;
          processing_status?: Database["public"]["Enums"]["source_version_status"];
          source_id?: string;
          version_number?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_versions_source_workspace_fk";
            columns: ["source_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "source_versions_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          added_by: string;
          authors: Json;
          created_at: string;
          deleted_at: string | null;
          external_ai_policy: Database["public"]["Enums"]["external_ai_policy"];
          external_identifier: string | null;
          external_url: string | null;
          file_checksum_sha256: string | null;
          file_mime_type: string | null;
          file_name: string | null;
          file_size_bytes: number | null;
          final_url: string | null;
          id: string;
          ingestion_status: Database["public"]["Enums"]["source_ingestion_status"];
          latest_source_version_id: string | null;
          organization: string | null;
          origin: Database["public"]["Enums"]["source_origin"];
          publication_date: string | null;
          quality: Database["public"]["Enums"]["source_quality"];
          rights_note: string;
          sensitivity: Database["public"]["Enums"]["source_sensitivity"];
          source_type: Database["public"]["Enums"]["source_type"];
          storage_path: string | null;
          subtitle: string | null;
          tags: string[];
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          added_by: string;
          authors?: Json;
          created_at?: string;
          deleted_at?: string | null;
          external_ai_policy?: Database["public"]["Enums"]["external_ai_policy"];
          external_identifier?: string | null;
          external_url?: string | null;
          file_checksum_sha256?: string | null;
          file_mime_type?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          final_url?: string | null;
          id?: string;
          ingestion_status?: Database["public"]["Enums"]["source_ingestion_status"];
          latest_source_version_id?: string | null;
          organization?: string | null;
          origin: Database["public"]["Enums"]["source_origin"];
          publication_date?: string | null;
          quality?: Database["public"]["Enums"]["source_quality"];
          rights_note: string;
          sensitivity?: Database["public"]["Enums"]["source_sensitivity"];
          source_type: Database["public"]["Enums"]["source_type"];
          storage_path?: string | null;
          subtitle?: string | null;
          tags?: string[];
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          added_by?: string;
          authors?: Json;
          created_at?: string;
          deleted_at?: string | null;
          external_ai_policy?: Database["public"]["Enums"]["external_ai_policy"];
          external_identifier?: string | null;
          external_url?: string | null;
          file_checksum_sha256?: string | null;
          file_mime_type?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          final_url?: string | null;
          id?: string;
          ingestion_status?: Database["public"]["Enums"]["source_ingestion_status"];
          latest_source_version_id?: string | null;
          organization?: string | null;
          origin?: Database["public"]["Enums"]["source_origin"];
          publication_date?: string | null;
          quality?: Database["public"]["Enums"]["source_quality"];
          rights_note?: string;
          sensitivity?: Database["public"]["Enums"]["source_sensitivity"];
          source_type?: Database["public"]["Enums"]["source_type"];
          storage_path?: string | null;
          subtitle?: string | null;
          tags?: string[];
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sources_added_by_profiles_id_fk";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_latest_version_workspace_fk";
            columns: ["latest_source_version_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "source_versions";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "sources_workspace_id_workspaces_id_fk";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      user_mastery: {
        Row: {
          concept_id: string;
          current_level: number;
          id: string;
          last_evidence_id: string | null;
          status: Database["public"]["Enums"]["mastery_status"];
          target_level: number;
          updated_at: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          concept_id: string;
          current_level?: number;
          id?: string;
          last_evidence_id?: string | null;
          status?: Database["public"]["Enums"]["mastery_status"];
          target_level?: number;
          updated_at?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          concept_id?: string;
          current_level?: number;
          id?: string;
          last_evidence_id?: string | null;
          status?: Database["public"]["Enums"]["mastery_status"];
          target_level?: number;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_mastery_concept_workspace_fk";
            columns: ["concept_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "user_mastery_evidence_workspace_fk";
            columns: ["last_evidence_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "mastery_evidence";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "user_mastery_user_id_profiles_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_mastery_workspace_id_workspaces_id_fk";
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
      concept_snapshot: { Args: { p_concept_id: string }; Returns: Json };
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
      create_file_source: {
        Args: {
          p_checksum_sha256: string;
          p_file_name: string;
          p_metadata: Json;
          p_mime_type: string;
          p_size_bytes: number;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      create_url_source: {
        Args: {
          p_extraction_schema_version?: string;
          p_metadata: Json;
          p_parser_profile?: string;
          p_url: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      enqueue_source_ingestion: {
        Args: {
          p_extraction_schema_version?: string;
          p_parser_profile?: string;
          p_source_id: string;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      get_concept_neighborhood: {
        Args: {
          p_concept_id: string;
          p_depth?: number;
          p_node_cap?: number;
          p_relation_keys?: string[];
          p_workspace_id: string;
        };
        Returns: Json;
      };
      install_atlas_seed: {
        Args: { p_seed: Json; p_workspace_id: string };
        Returns: Json;
      };
      install_learning_seed: {
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
      remove_atlas_relation: {
        Args: {
          p_expected_updated_at: string;
          p_relation_id: string;
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      replace_concept_aliases: {
        Args: { p_aliases: Json; p_concept_id: string; p_workspace_id: string };
        Returns: undefined;
      };
      retry_ingestion_job: {
        Args: { p_job_id: string; p_workspace_id: string };
        Returns: Json;
      };
      search_concepts_lexical: {
        Args: {
          p_content_statuses?: Database["public"]["Enums"]["content_status"][];
          p_domain_ids?: string[];
          p_limit?: number;
          p_query: string;
          p_workspace_id: string;
        };
        Returns: {
          alias_match: boolean;
          id: string;
          lexical_score: number;
          matched_alias: string;
          rank: number;
          text_match: boolean;
          title_match: boolean;
        }[];
      };
      search_concepts_semantic: {
        Args: {
          p_content_statuses?: Database["public"]["Enums"]["content_status"][];
          p_domain_ids?: string[];
          p_limit?: number;
          p_query_embedding: string;
          p_workspace_id: string;
        };
        Returns: {
          id: string;
          rank: number;
          semantic_distance: number;
        }[];
      };
      search_source_segments_lexical: {
        Args: {
          p_limit?: number;
          p_query: string;
          p_source_qualities?: Database["public"]["Enums"]["source_quality"][];
          p_source_types?: Database["public"]["Enums"]["source_type"][];
          p_workspace_id: string;
        };
        Returns: {
          lexical_score: number;
          quality: Database["public"]["Enums"]["source_quality"];
          rank: number;
          segment_id: string;
          snippet: string;
          source_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          title: string;
        }[];
      };
      set_concept_embedding: {
        Args: {
          p_concept_id: string;
          p_embedding: string;
          p_embedding_model: string;
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      set_learning_prerequisite_waiver: {
        Args: {
          p_learning_path_id: string;
          p_prerequisite_concept_id: string;
          p_reason: string;
          p_target_concept_id: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      shares_workspace_with: {
        Args: { profile_uuid: string };
        Returns: boolean;
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
      update_user_mastery: {
        Args: {
          p_artifact_url?: string;
          p_concept_id: string;
          p_current_level: number;
          p_evidence_type: Database["public"]["Enums"]["mastery_evidence_type"];
          p_note?: string;
          p_status: Database["public"]["Enums"]["mastery_status"];
          p_target_level: number;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      upsert_learning_path: {
        Args: { p_path_id?: string; p_payload: Json; p_workspace_id: string };
        Returns: string;
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
      external_ai_policy: "allowed" | "denied" | "explicit_per_run";
      ingestion_job_status:
        "queued" | "running" | "completed" | "failed" | "dead_letter";
      ingestion_stage: "download" | "parse" | "persist" | "segment";
      mastery_evidence_type:
        | "self_assessment"
        | "explanation"
        | "quiz"
        | "applied_analysis"
        | "design_artifact"
        | "critique"
        | "external_evaluation";
      mastery_status:
        "not_started" | "learning" | "applied" | "mastered" | "revisit";
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
      source_ingestion_status:
        | "pending"
        | "queued"
        | "parsing"
        | "persisting"
        | "segmenting"
        | "completed"
        | "failed";
      source_origin: "file" | "url";
      source_quality:
        "canonical" | "primary" | "secondary" | "practitioner" | "unknown";
      source_segment_type:
        | "heading"
        | "paragraph"
        | "list"
        | "table"
        | "figure_caption"
        | "code"
        | "formula"
        | "transcript"
        | "other";
      source_sensitivity: "public" | "internal" | "confidential";
      source_type:
        | "book"
        | "paper"
        | "standard"
        | "course"
        | "documentation"
        | "article"
        | "webpage"
        | "report"
        | "thesis"
        | "dataset"
        | "note"
        | "other";
      source_version_status: "processing" | "completed" | "failed";
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
      external_ai_policy: ["allowed", "denied", "explicit_per_run"],
      ingestion_job_status: [
        "queued",
        "running",
        "completed",
        "failed",
        "dead_letter",
      ],
      ingestion_stage: ["download", "parse", "persist", "segment"],
      mastery_evidence_type: [
        "self_assessment",
        "explanation",
        "quiz",
        "applied_analysis",
        "design_artifact",
        "critique",
        "external_evaluation",
      ],
      mastery_status: [
        "not_started",
        "learning",
        "applied",
        "mastered",
        "revisit",
      ],
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
      source_ingestion_status: [
        "pending",
        "queued",
        "parsing",
        "persisting",
        "segmenting",
        "completed",
        "failed",
      ],
      source_origin: ["file", "url"],
      source_quality: [
        "canonical",
        "primary",
        "secondary",
        "practitioner",
        "unknown",
      ],
      source_segment_type: [
        "heading",
        "paragraph",
        "list",
        "table",
        "figure_caption",
        "code",
        "formula",
        "transcript",
        "other",
      ],
      source_sensitivity: ["public", "internal", "confidential"],
      source_type: [
        "book",
        "paper",
        "standard",
        "course",
        "documentation",
        "article",
        "webpage",
        "report",
        "thesis",
        "dataset",
        "note",
        "other",
      ],
      source_version_status: ["processing", "completed", "failed"],
      workspace_role: ["owner", "editor", "viewer"],
    },
  },
} as const;
