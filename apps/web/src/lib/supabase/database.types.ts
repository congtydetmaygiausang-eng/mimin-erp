export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      agent_config: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          max_tokens: number | null
          model: string | null
          personality: string | null
          routing_rules: Json | null
          system_prompt: string | null
          temperature: number | null
          tools: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          personality?: string | null
          routing_rules?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          tools?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          personality?: string | null
          routing_rules?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          tools?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      agent_execution_log: {
        Row: {
          agent_id: string
          agent_response: string | null
          completed_at: string | null
          confidence: number | null
          created_at: string
          error_message: string | null
          id: string
          intent: string | null
          required_confirmation: boolean | null
          routing_score: Json | null
          screen_context: Json | null
          status: string
          tool_count: number | null
          tools_called: Json | null
          usage_log_id: string | null
          user_confirmed: boolean | null
          user_id: string | null
          user_input: string
        }
        Insert: {
          agent_id: string
          agent_response?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          intent?: string | null
          required_confirmation?: boolean | null
          routing_score?: Json | null
          screen_context?: Json | null
          status?: string
          tool_count?: number | null
          tools_called?: Json | null
          usage_log_id?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
          user_input: string
        }
        Update: {
          agent_id?: string
          agent_response?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          intent?: string | null
          required_confirmation?: boolean | null
          routing_score?: Json | null
          screen_context?: Json | null
          status?: string
          tool_count?: number | null
          tools_called?: Json | null
          usage_log_id?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
          user_input?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_execution_log_usage_log_id_fkey"
            columns: ["usage_log_id"]
            isOneToOne: false
            referencedRelation: "agent_usage_log"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_execution_logs: {
        Row: {
          agent_id: string
          agent_response: string | null
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          execution_id: string
          id: string
          status: string | null
          tool_calls: Json | null
          user_id: string | null
          user_message: string | null
        }
        Insert: {
          agent_id: string
          agent_response?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_id: string
          id?: string
          status?: string | null
          tool_calls?: Json | null
          user_id?: string | null
          user_message?: string | null
        }
        Update: {
          agent_id?: string
          agent_response?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_id?: string
          id?: string
          status?: string | null
          tool_calls?: Json | null
          user_id?: string | null
          user_message?: string | null
        }
        Relationships: []
      }
      agent_tool_log: {
        Row: {
          affected_rows: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          execution_id: string | null
          id: string
          required_permission: string | null
          requires_confirmation: boolean | null
          status: string
          table_name: string | null
          tool_args: Json | null
          tool_category: string | null
          tool_name: string
          tool_result: Json | null
          user_confirmed: boolean | null
          user_has_permission: boolean | null
        }
        Insert: {
          affected_rows?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          required_permission?: string | null
          requires_confirmation?: boolean | null
          status?: string
          table_name?: string | null
          tool_args?: Json | null
          tool_category?: string | null
          tool_name: string
          tool_result?: Json | null
          user_confirmed?: boolean | null
          user_has_permission?: boolean | null
        }
        Update: {
          affected_rows?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          required_permission?: string | null
          requires_confirmation?: boolean | null
          status?: string
          table_name?: string | null
          tool_args?: Json | null
          tool_category?: string | null
          tool_name?: string
          tool_result?: Json | null
          user_confirmed?: boolean | null
          user_has_permission?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tool_log_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "agent_execution_log"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tool_logs: {
        Row: {
          agent_id: string
          created_at: string
          execution_id: string | null
          id: string
          is_error: boolean | null
          latency_ms: number | null
          tool_args: Json | null
          tool_name: string
          tool_result: Json | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          execution_id?: string | null
          id?: string
          is_error?: boolean | null
          latency_ms?: number | null
          tool_args?: Json | null
          tool_name: string
          tool_result?: Json | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          execution_id?: string | null
          id?: string
          is_error?: boolean | null
          latency_ms?: number | null
          tool_args?: Json | null
          tool_name?: string
          tool_result?: Json | null
        }
        Relationships: []
      }
      agent_usage_log: {
        Row: {
          agent_id: string
          cost_usd: number | null
          created_at: string
          error_message: string | null
          id: string
          input_tokens: number | null
          ip_address: string | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          provider: string
          request_id: string | null
          status: string
          total_tokens: number | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          ip_address?: string | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          provider: string
          request_id?: string | null
          status?: string
          total_tokens?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          ip_address?: string | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          provider?: string
          request_id?: string | null
          status?: string
          total_tokens?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_usage_logs: {
        Row: {
          agent_id: string
          completion_tokens: number | null
          cost_usd: number
          created_at: string
          error_message: string | null
          id: string
          is_error: boolean
          latency_ms: number
          model: string | null
          prompt_tokens: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          completion_tokens?: number | null
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          is_error?: boolean
          latency_ms?: number
          model?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          completion_tokens?: number | null
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          id?: string
          is_error?: boolean
          latency_ms?: number
          model?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_search_history: {
        Row: {
          assistant_reply: string | null
          created_at: string
          entry_point: string
          error_message: string | null
          id: string
          organization_id: string
          provider: string | null
          query_text: string
          result_count: number
          status: string
          structured_filters: Json
          tool_calls: Json
          tool_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          assistant_reply?: string | null
          created_at?: string
          entry_point?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          provider?: string | null
          query_text: string
          result_count?: number
          status?: string
          structured_filters?: Json
          tool_calls?: Json
          tool_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_reply?: string | null
          created_at?: string
          entry_point?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          provider?: string | null
          query_text?: string
          result_count?: number
          status?: string
          structured_filters?: Json
          tool_calls?: Json
          tool_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_search_results: {
        Row: {
          address: string | null
          confidence: number | null
          created_at: string
          distance_km: number | null
          district: string | null
          email: string | null
          id: string
          legal_name: string
          location_status: string | null
          matched_candidate_id: string | null
          matched_partner_id: string | null
          organization_id: string
          phone: string | null
          province: string | null
          raw_candidate: Json
          result_tier: string | null
          search_history_id: string
          source_url: string | null
          tax_code: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          confidence?: number | null
          created_at?: string
          distance_km?: number | null
          district?: string | null
          email?: string | null
          id?: string
          legal_name: string
          location_status?: string | null
          matched_candidate_id?: string | null
          matched_partner_id?: string | null
          organization_id?: string
          phone?: string | null
          province?: string | null
          raw_candidate?: Json
          result_tier?: string | null
          search_history_id: string
          source_url?: string | null
          tax_code?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          confidence?: number | null
          created_at?: string
          distance_km?: number | null
          district?: string | null
          email?: string | null
          id?: string
          legal_name?: string
          location_status?: string | null
          matched_candidate_id?: string | null
          matched_partner_id?: string | null
          organization_id?: string
          phone?: string | null
          province?: string | null
          raw_candidate?: Json
          result_tier?: string | null
          search_history_id?: string
          source_url?: string | null
          tax_code?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_search_results_matched_candidate_id_fkey"
            columns: ["matched_candidate_id"]
            isOneToOne: false
            referencedRelation: "production_discovery_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_search_results_matched_partner_id_fkey"
            columns: ["matched_partner_id"]
            isOneToOne: false
            referencedRelation: "production_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_search_results_search_history_id_fkey"
            columns: ["search_history_id"]
            isOneToOne: false
            referencedRelation: "ai_search_history"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          description: string | null
          error_message: string | null
          id: string
          ip: string | null
          module: string
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_name: string | null
          success: boolean | null
          timestamp: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          description?: string | null
          error_message?: string | null
          id: string
          ip?: string | null
          module: string
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          description?: string | null
          error_message?: string | null
          id?: string
          ip?: string | null
          module?: string
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_logs_users"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bang_chi_phi_co_dinh: {
        Row: {
          chi_phi: Json
          created_at: string | null
          id: string
          ten: string
          updated_at: string | null
        }
        Insert: {
          chi_phi?: Json
          created_at?: string | null
          id: string
          ten: string
          updated_at?: string | null
        }
        Update: {
          chi_phi?: Json
          created_at?: string | null
          id?: string
          ten?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bang_luong: {
        Row: {
          created_at: string | null
          ghi_chu: string | null
          id: string
          luong_cung: number | null
          luong_sp: number | null
          ma_nv: string
          ngay_tt: string | null
          nguoi_tt: string | null
          phu_cap: number | null
          thang: string
          thuc_nhan: number | null
          trang_thai: string | null
        }
        Insert: {
          created_at?: string | null
          ghi_chu?: string | null
          id: string
          luong_cung?: number | null
          luong_sp?: number | null
          ma_nv: string
          ngay_tt?: string | null
          nguoi_tt?: string | null
          phu_cap?: number | null
          thang: string
          thuc_nhan?: number | null
          trang_thai?: string | null
        }
        Update: {
          created_at?: string | null
          ghi_chu?: string | null
          id?: string
          luong_cung?: number | null
          luong_sp?: number | null
          ma_nv?: string
          ngay_tt?: string | null
          nguoi_tt?: string | null
          phu_cap?: number | null
          thang?: string
          thuc_nhan?: number | null
          trang_thai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bang_luong_nhan_su"
            columns: ["ma_nv"]
            isOneToOne: false
            referencedRelation: "nhan_su"
            referencedColumns: ["ma_nv"]
          },
        ]
      }
      bang_size: {
        Row: {
          created_at: string
          ghi_chu: string | null
          gia_tri: string
          id: string
          ratios: number[]
          ri_so: number
          sizes: string[]
          ten_bang: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ghi_chu?: string | null
          gia_tri: string
          id: string
          ratios: number[]
          ri_so: number
          sizes: string[]
          ten_bang: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ghi_chu?: string | null
          gia_tri?: string
          id?: string
          ratios?: number[]
          ri_so?: number
          sizes?: string[]
          ten_bang?: string
          updated_at?: string
        }
        Relationships: []
      }
      bang_tin_bai_dang: {
        Row: {
          created_at: string
          created_by_name: string | null
          ghim: boolean | null
          hinh_anh: Json | null
          id: string
          noi_dung: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by_name?: string | null
          ghim?: boolean | null
          hinh_anh?: Json | null
          id: string
          noi_dung?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by_name?: string | null
          ghim?: boolean | null
          hinh_anh?: Json | null
          id?: string
          noi_dung?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      bang_tin_binh_luan: {
        Row: {
          bai_dang_id: string
          created_at: string
          created_by_name: string | null
          id: string
          noi_dung: string
        }
        Insert: {
          bai_dang_id: string
          created_at?: string
          created_by_name?: string | null
          id: string
          noi_dung: string
        }
        Update: {
          bai_dang_id?: string
          created_at?: string
          created_by_name?: string | null
          id?: string
          noi_dung?: string
        }
        Relationships: [
          {
            foreignKeyName: "bang_tin_binh_luan_bai_dang_id_fkey"
            columns: ["bai_dang_id"]
            isOneToOne: false
            referencedRelation: "bang_tin_bai_dang"
            referencedColumns: ["id"]
          },
        ]
      }
      bang_tin_ho_so: {
        Row: {
          anh_bia: string | null
          anh_dai_dien: string | null
          id: string
          updated_at: string
        }
        Insert: {
          anh_bia?: string | null
          anh_dai_dien?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          anh_bia?: string | null
          anh_dai_dien?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      bang_tin_luot_thich: {
        Row: {
          bai_dang_id: string
          created_at: string
          created_by_name: string | null
          id: string
        }
        Insert: {
          bai_dang_id: string
          created_at?: string
          created_by_name?: string | null
          id: string
        }
        Update: {
          bai_dang_id?: string
          created_at?: string
          created_by_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bang_tin_luot_thich_bai_dang_id_fkey"
            columns: ["bai_dang_id"]
            isOneToOne: false
            referencedRelation: "bang_tin_bai_dang"
            referencedColumns: ["id"]
          },
        ]
      }
      bang_tin_thong_bao: {
        Row: {
          bai_dang_id: string | null
          created_at: string
          da_doc: boolean
          id: string
          loai: string
          nguoi_gui_name: string
          nguoi_nhan_name: string
          noi_dung: string | null
        }
        Insert: {
          bai_dang_id?: string | null
          created_at?: string
          da_doc?: boolean
          id: string
          loai: string
          nguoi_gui_name: string
          nguoi_nhan_name: string
          noi_dung?: string | null
        }
        Update: {
          bai_dang_id?: string | null
          created_at?: string
          da_doc?: boolean
          id?: string
          loai?: string
          nguoi_gui_name?: string
          nguoi_nhan_name?: string
          noi_dung?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bang_tin_thong_bao_bai_dang_id_fkey"
            columns: ["bai_dang_id"]
            isOneToOne: false
            referencedRelation: "bang_tin_bai_dang"
            referencedColumns: ["id"]
          },
        ]
      }
      cong_nhan_gia_cong: {
        Row: {
          created_at: string | null
          diaChi: string | null
          facebook_url: string | null
          ghiChu: string | null
          hoTen: string
          id: string
          loaiHang: string
          ngayTao: string | null
          nguoiTao: string | null
          sdt: string
          soTho: number | null
          stt: number
          trangThai: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          diaChi?: string | null
          facebook_url?: string | null
          ghiChu?: string | null
          hoTen: string
          id: string
          loaiHang: string
          ngayTao?: string | null
          nguoiTao?: string | null
          sdt: string
          soTho?: number | null
          stt: number
          trangThai?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          diaChi?: string | null
          facebook_url?: string | null
          ghiChu?: string | null
          hoTen?: string
          id?: string
          loaiHang?: string
          ngayTao?: string | null
          nguoiTao?: string | null
          sdt?: string
          soTho?: number | null
          stt?: number
          trangThai?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cong_no: {
        Row: {
          boPhan: string | null
          created_at: string | null
          ghiChu: string | null
          id: string
          maLenhCat: string | null
          ngayTao: string | null
          ngayTT: string | null
          nguoiPhuTrach: string | null
          soTien: number | null
          trangThai: string | null
          updated_at: string | null
          version: number
        }
        Insert: {
          boPhan?: string | null
          created_at?: string | null
          ghiChu?: string | null
          id: string
          maLenhCat?: string | null
          ngayTao?: string | null
          ngayTT?: string | null
          nguoiPhuTrach?: string | null
          soTien?: number | null
          trangThai?: string | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          boPhan?: string | null
          created_at?: string | null
          ghiChu?: string | null
          id?: string
          maLenhCat?: string | null
          ngayTao?: string | null
          ngayTT?: string | null
          nguoiPhuTrach?: string | null
          soTien?: number | null
          trangThai?: string | null
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      cong_thuc_dinh_muc: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: Json
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          credit_limit: number
          customer_code: string
          customer_name: string
          customer_type: string | null
          email: string | null
          facebook_url: string | null
          id: number
          last_updated_at: string | null
          logo_url: string | null
          opening_debt: number
          phone: string
          rating: number | null
          shipping_address: string | null
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_limit?: number
          customer_code: string
          customer_name: string
          customer_type?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: number
          last_updated_at?: string | null
          logo_url?: string | null
          opening_debt?: number
          phone: string
          rating?: number | null
          shipping_address?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_limit?: number
          customer_code?: string
          customer_name?: string
          customer_type?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: number
          last_updated_at?: string | null
          logo_url?: string | null
          opening_debt?: number
          phone?: string
          rating?: number | null
          shipping_address?: string | null
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers_staging: {
        Row: {
          credit_limit: number | null
          customer_code: string | null
          customer_name: string | null
          customer_type: string | null
          email: string | null
          facebook_url: string | null
          id: number
          imported_at: string
          last_updated_at: string | null
          logo_url: string | null
          opening_debt: number | null
          phone: string | null
          rating: number | null
          shipping_address: string | null
          tax_code: string | null
        }
        Insert: {
          credit_limit?: number | null
          customer_code?: string | null
          customer_name?: string | null
          customer_type?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: number
          imported_at?: string
          last_updated_at?: string | null
          logo_url?: string | null
          opening_debt?: number | null
          phone?: string | null
          rating?: number | null
          shipping_address?: string | null
          tax_code?: string | null
        }
        Update: {
          credit_limit?: number | null
          customer_code?: string | null
          customer_name?: string | null
          customer_type?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: number
          imported_at?: string
          last_updated_at?: string | null
          logo_url?: string | null
          opening_debt?: number | null
          phone?: string | null
          rating?: number | null
          shipping_address?: string | null
          tax_code?: string | null
        }
        Relationships: []
      }
      doi_soat: {
        Row: {
          congDoan: string | null
          conNo: number | null
          created_at: string | null
          daThanhToan: number | null
          donGia: number | null
          id: string
          khauTru: number | null
          khiieuNai: Json | null
          lichSu: Json | null
          locked: boolean | null
          maSP: string | null
          ngayGiao: string | null
          ngayTao: string | null
          nguoiTao: string | null
          nguoiThucHien: string | null
          nguoiThucHienMa: string | null
          phanLoai: string | null
          soLuongDat: number | null
          soLuongLoi: number | null
          soLuongNhan: number | null
          taskId: string | null
          thanhTien: number | null
          thucNhan: number | null
          trangThai: string | null
        }
        Insert: {
          congDoan?: string | null
          conNo?: number | null
          created_at?: string | null
          daThanhToan?: number | null
          donGia?: number | null
          id: string
          khauTru?: number | null
          khiieuNai?: Json | null
          lichSu?: Json | null
          locked?: boolean | null
          maSP?: string | null
          ngayGiao?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          nguoiThucHien?: string | null
          nguoiThucHienMa?: string | null
          phanLoai?: string | null
          soLuongDat?: number | null
          soLuongLoi?: number | null
          soLuongNhan?: number | null
          taskId?: string | null
          thanhTien?: number | null
          thucNhan?: number | null
          trangThai?: string | null
        }
        Update: {
          congDoan?: string | null
          conNo?: number | null
          created_at?: string | null
          daThanhToan?: number | null
          donGia?: number | null
          id?: string
          khauTru?: number | null
          khiieuNai?: Json | null
          lichSu?: Json | null
          locked?: boolean | null
          maSP?: string | null
          ngayGiao?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          nguoiThucHien?: string | null
          nguoiThucHienMa?: string | null
          phanLoai?: string | null
          soLuongDat?: number | null
          soLuongLoi?: number | null
          soLuongNhan?: number | null
          taskId?: string | null
          thanhTien?: number | null
          thucNhan?: number | null
          trangThai?: string | null
        }
        Relationships: []
      }
      don_hang: {
        Row: {
          created_at: string | null
          da_tru_kho: boolean | null
          dia_chi: string | null
          don_gia: number | null
          email: string | null
          ghi_chu: string | null
          giam_gia: number | null
          id: string
          items: Json | null
          kenh_ban: string | null
          khach_hang: string
          lo_hang: string | null
          loai: string | null
          loai_don: string | null
          loai_don_hang: string | null
          ma_dh: string
          ngay_dat: string
          ngay_giao: string
          payments: Json | null
          san_pham: string | null
          sdt: string | null
          shipping: Json | null
          so_luong: number | null
          thanh_tien: number
          tien_coc: number | null
          tien_cuoi_ky: number | null
          tong_tien: number | null
          trang_thai: string | null
          trang_thai_thanh_toan: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          da_tru_kho?: boolean | null
          dia_chi?: string | null
          don_gia?: number | null
          email?: string | null
          ghi_chu?: string | null
          giam_gia?: number | null
          id: string
          items?: Json | null
          kenh_ban?: string | null
          khach_hang: string
          lo_hang?: string | null
          loai?: string | null
          loai_don?: string | null
          loai_don_hang?: string | null
          ma_dh: string
          ngay_dat: string
          ngay_giao: string
          payments?: Json | null
          san_pham?: string | null
          sdt?: string | null
          shipping?: Json | null
          so_luong?: number | null
          thanh_tien: number
          tien_coc?: number | null
          tien_cuoi_ky?: number | null
          tong_tien?: number | null
          trang_thai?: string | null
          trang_thai_thanh_toan?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          da_tru_kho?: boolean | null
          dia_chi?: string | null
          don_gia?: number | null
          email?: string | null
          ghi_chu?: string | null
          giam_gia?: number | null
          id?: string
          items?: Json | null
          kenh_ban?: string | null
          khach_hang?: string
          lo_hang?: string | null
          loai?: string | null
          loai_don?: string | null
          loai_don_hang?: string | null
          ma_dh?: string
          ngay_dat?: string
          ngay_giao?: string
          payments?: Json | null
          san_pham?: string | null
          sdt?: string | null
          shipping?: Json | null
          so_luong?: number | null
          thanh_tien?: number
          tien_coc?: number | null
          tien_cuoi_ky?: number | null
          tong_tien?: number | null
          trang_thai?: string | null
          trang_thai_thanh_toan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gia_cong: {
        Row: {
          congDoan: string | null
          created_at: string | null
          donGia: number | null
          ghiChu: string | null
          id: string
          maDoiTac: string | null
          maLenhCat: string | null
          ngayGiao: string | null
          ngayNhan: string | null
          ngayTao: string | null
          nguoiTao: string | null
          soLuongGiao: number | null
          soLuongNhan: number | null
          tenDoiTac: string | null
          thanhTien: number | null
          trangThai: string | null
          updated_at: string | null
        }
        Insert: {
          congDoan?: string | null
          created_at?: string | null
          donGia?: number | null
          ghiChu?: string | null
          id: string
          maDoiTac?: string | null
          maLenhCat?: string | null
          ngayGiao?: string | null
          ngayNhan?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          soLuongGiao?: number | null
          soLuongNhan?: number | null
          tenDoiTac?: string | null
          thanhTien?: number | null
          trangThai?: string | null
          updated_at?: string | null
        }
        Update: {
          congDoan?: string | null
          created_at?: string | null
          donGia?: number | null
          ghiChu?: string | null
          id?: string
          maDoiTac?: string | null
          maLenhCat?: string | null
          ngayGiao?: string | null
          ngayNhan?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          soLuongGiao?: number | null
          soLuongNhan?: number | null
          tenDoiTac?: string | null
          thanhTien?: number | null
          trangThai?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      giao_dich_kho: {
        Row: {
          created_at: string | null
          don_gia: number | null
          don_vi: string | null
          ghi_chu: string | null
          id: string
          loai: string
          loai_kho: string
          ma_vt: string
          ngay: string
          nguoi_thuc_hien: string | null
          nguon_nhap: string | null
          so_luong: number
          ten_vt: string | null
          thanh_tien: number | null
          version: number
        }
        Insert: {
          created_at?: string | null
          don_gia?: number | null
          don_vi?: string | null
          ghi_chu?: string | null
          id: string
          loai: string
          loai_kho: string
          ma_vt: string
          ngay: string
          nguoi_thuc_hien?: string | null
          nguon_nhap?: string | null
          so_luong: number
          ten_vt?: string | null
          thanh_tien?: number | null
          version?: number
        }
        Update: {
          created_at?: string | null
          don_gia?: number | null
          don_vi?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: string
          loai_kho?: string
          ma_vt?: string
          ngay?: string
          nguoi_thuc_hien?: string | null
          nguon_nhap?: string | null
          so_luong?: number
          ten_vt?: string | null
          thanh_tien?: number | null
          version?: number
        }
        Relationships: []
      }
      giao_hang: {
        Row: {
          created_at: string | null
          diaChi: string | null
          donHang: string | null
          ghiChu: string | null
          id: string
          khachHang: string | null
          maGH: string | null
          ngayGiao: string | null
          ngayTao: string | null
          nguoiTao: string | null
          nguoiVanChuyen: string | null
          phuongTien: string | null
          sdt: string | null
          soLuong: number | null
          trangThai: string | null
        }
        Insert: {
          created_at?: string | null
          diaChi?: string | null
          donHang?: string | null
          ghiChu?: string | null
          id: string
          khachHang?: string | null
          maGH?: string | null
          ngayGiao?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          nguoiVanChuyen?: string | null
          phuongTien?: string | null
          sdt?: string | null
          soLuong?: number | null
          trangThai?: string | null
        }
        Update: {
          created_at?: string | null
          diaChi?: string | null
          donHang?: string | null
          ghiChu?: string | null
          id?: string
          khachHang?: string | null
          maGH?: string | null
          ngayGiao?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          nguoiVanChuyen?: string | null
          phuongTien?: string | null
          sdt?: string | null
          soLuong?: number | null
          trangThai?: string | null
        }
        Relationships: []
      }
      hoa_don_dien_tu: {
        Row: {
          buyer_address: string | null
          buyer_email: string | null
          buyer_legal_name: string
          buyer_phone: string | null
          buyer_tax_code: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          einvoice_data: Json | null
          id: string
          inv_date: string | null
          inv_no: string | null
          inv_series: string
          issued_at: string | null
          nguoi_tao: string | null
          original_invoice_detail: Json | null
          pdf_url: string | null
          publish_status: number | null
          ref_id: string
          ref_id_don_hang: string | null
          ref_id_khach_hang: string | null
          status: string
          total_amount: number
          total_with_vat: number
          transaction_id: string | null
          updated_at: string
          vat_amount: number
          xml_url: string | null
        }
        Insert: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_legal_name: string
          buyer_phone?: string | null
          buyer_tax_code?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          einvoice_data?: Json | null
          id: string
          inv_date?: string | null
          inv_no?: string | null
          inv_series: string
          issued_at?: string | null
          nguoi_tao?: string | null
          original_invoice_detail?: Json | null
          pdf_url?: string | null
          publish_status?: number | null
          ref_id: string
          ref_id_don_hang?: string | null
          ref_id_khach_hang?: string | null
          status?: string
          total_amount?: number
          total_with_vat?: number
          transaction_id?: string | null
          updated_at?: string
          vat_amount?: number
          xml_url?: string | null
        }
        Update: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_legal_name?: string
          buyer_phone?: string | null
          buyer_tax_code?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          einvoice_data?: Json | null
          id?: string
          inv_date?: string | null
          inv_no?: string | null
          inv_series?: string
          issued_at?: string | null
          nguoi_tao?: string | null
          original_invoice_detail?: Json | null
          pdf_url?: string | null
          publish_status?: number | null
          ref_id?: string
          ref_id_don_hang?: string | null
          ref_id_khach_hang?: string | null
          status?: string
          total_amount?: number
          total_with_vat?: number
          transaction_id?: string | null
          updated_at?: string
          vat_amount?: number
          xml_url?: string | null
        }
        Relationships: []
      }
      hoa_don_log: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          endpoint: string | null
          error_msg: string | null
          hoa_don_id: string | null
          id: string
          ip_address: string | null
          request_body: Json | null
          response_body: Json | null
          response_status: number | null
          user_email: string | null
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          endpoint?: string | null
          error_msg?: string | null
          hoa_don_id?: string | null
          id?: string
          ip_address?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          user_email?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          endpoint?: string | null
          error_msg?: string | null
          hoa_don_id?: string | null
          id?: string
          ip_address?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_don_log_hoa_don_id_fkey"
            columns: ["hoa_don_id"]
            isOneToOne: false
            referencedRelation: "hoa_don_dien_tu"
            referencedColumns: ["id"]
          },
        ]
      }
      hoan_thien: {
        Row: {
          congDoan: string | null
          created_at: string | null
          donGia: number | null
          ghiChu: string | null
          hanHoanThanh: string | null
          id: string
          lenhSX: string | null
          lichSu: Json | null
          locked: boolean | null
          maSP: string | null
          mau: string | null
          ngayBanGiao: string | null
          ngayGiao: string | null
          ngayHoanThanh: string | null
          ngayNhan: string | null
          nguoiThucHien: string | null
          nguoiThucHienMa: string | null
          phanLoai: string | null
          size: string | null
          soLuongDat: number | null
          soLuongGiao: number | null
          soLuongLoi: number | null
          soLuongNhan: number | null
          taskId: string | null
          thanhTien: number | null
          trangThai: string | null
        }
        Insert: {
          congDoan?: string | null
          created_at?: string | null
          donGia?: number | null
          ghiChu?: string | null
          hanHoanThanh?: string | null
          id: string
          lenhSX?: string | null
          lichSu?: Json | null
          locked?: boolean | null
          maSP?: string | null
          mau?: string | null
          ngayBanGiao?: string | null
          ngayGiao?: string | null
          ngayHoanThanh?: string | null
          ngayNhan?: string | null
          nguoiThucHien?: string | null
          nguoiThucHienMa?: string | null
          phanLoai?: string | null
          size?: string | null
          soLuongDat?: number | null
          soLuongGiao?: number | null
          soLuongLoi?: number | null
          soLuongNhan?: number | null
          taskId?: string | null
          thanhTien?: number | null
          trangThai?: string | null
        }
        Update: {
          congDoan?: string | null
          created_at?: string | null
          donGia?: number | null
          ghiChu?: string | null
          hanHoanThanh?: string | null
          id?: string
          lenhSX?: string | null
          lichSu?: Json | null
          locked?: boolean | null
          maSP?: string | null
          mau?: string | null
          ngayBanGiao?: string | null
          ngayGiao?: string | null
          ngayHoanThanh?: string | null
          ngayNhan?: string | null
          nguoiThucHien?: string | null
          nguoiThucHienMa?: string | null
          phanLoai?: string | null
          size?: string | null
          soLuongDat?: number | null
          soLuongGiao?: number | null
          soLuongLoi?: number | null
          soLuongNhan?: number | null
          taskId?: string | null
          thanhTien?: number | null
          trangThai?: string | null
        }
        Relationships: []
      }
      khach_hang: {
        Row: {
          cong_no: number | null
          created_at: string | null
          dia_chi: string | null
          email: string | null
          facebook_url: string | null
          ghi_chu: string | null
          han_muc_no: number | null
          id: string
          loai: string | null
          ma_kh: string
          mst: string | null
          nhu_cau_chinh: Json | null
          rating: number | null
          sdt: string | null
          ten_kh: string
          trang_thai: string | null
        }
        Insert: {
          cong_no?: number | null
          created_at?: string | null
          dia_chi?: string | null
          email?: string | null
          facebook_url?: string | null
          ghi_chu?: string | null
          han_muc_no?: number | null
          id: string
          loai?: string | null
          ma_kh: string
          mst?: string | null
          nhu_cau_chinh?: Json | null
          rating?: number | null
          sdt?: string | null
          ten_kh: string
          trang_thai?: string | null
        }
        Update: {
          cong_no?: number | null
          created_at?: string | null
          dia_chi?: string | null
          email?: string | null
          facebook_url?: string | null
          ghi_chu?: string | null
          han_muc_no?: number | null
          id?: string
          loai?: string | null
          ma_kh?: string
          mst?: string | null
          nhu_cau_chinh?: Json | null
          rating?: number | null
          sdt?: string | null
          ten_kh?: string
          trang_thai?: string | null
        }
        Relationships: []
      }
      kho: {
        Row: {
          created_at: string | null
          don_gia: number | null
          dvt: string | null
          ghi_chu: string | null
          id: string
          kho: string | null
          loai: string
          loai_chi_tiet: string | null
          ma_ncc: string | null
          mau_sac: string | null
          sku: string
          so_cay_nhap: number | null
          ten_vt: string
          ton_cay: number | null
          ton_kho: number | null
          ton_toi_thieu: number | null
          ty_le_hao_hut: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          don_gia?: number | null
          dvt?: string | null
          ghi_chu?: string | null
          id?: string
          kho?: string | null
          loai: string
          loai_chi_tiet?: string | null
          ma_ncc?: string | null
          mau_sac?: string | null
          sku: string
          so_cay_nhap?: number | null
          ten_vt: string
          ton_cay?: number | null
          ton_kho?: number | null
          ton_toi_thieu?: number | null
          ty_le_hao_hut?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          don_gia?: number | null
          dvt?: string | null
          ghi_chu?: string | null
          id?: string
          kho?: string | null
          loai?: string
          loai_chi_tiet?: string | null
          ma_ncc?: string | null
          mau_sac?: string | null
          sku?: string
          so_cay_nhap?: number | null
          ten_vt?: string
          ton_cay?: number | null
          ton_kho?: number | null
          ton_toi_thieu?: number | null
          ty_le_hao_hut?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kho_mau_yeu_cau: {
        Row: {
          created_at: string
          ghi_chu: string | null
          hinh_anh: string | null
          id: string
          ma_sp: string
          nguoi_gui_name: string | null
          sdt_khach: string | null
          so_luong_yeu_cau: number | null
          ten_khach: string | null
          ten_sp: string
          trang_thai: string
        }
        Insert: {
          created_at?: string
          ghi_chu?: string | null
          hinh_anh?: string | null
          id: string
          ma_sp: string
          nguoi_gui_name?: string | null
          sdt_khach?: string | null
          so_luong_yeu_cau?: number | null
          ten_khach?: string | null
          ten_sp: string
          trang_thai?: string
        }
        Update: {
          created_at?: string
          ghi_chu?: string | null
          hinh_anh?: string | null
          id?: string
          ma_sp?: string
          nguoi_gui_name?: string | null
          sdt_khach?: string | null
          so_luong_yeu_cau?: number | null
          ten_khach?: string | null
          ten_sp?: string
          trang_thai?: string
        }
        Relationships: []
      }
      kho_mobile: {
        Row: {
          created_at: string | null
          donGia: number | null
          donVi: string | null
          ghiChu: string | null
          id: string
          lichSu: Json | null
          loai: string | null
          loaiKho: string | null
          lsx: string | null
          maNV: string | null
          maSP: string | null
          ngayDuyet: string | null
          ngayHoanThanh: string | null
          ngayTao: string | null
          nguoiDuyet: string | null
          nguoiTao: string | null
          nhaCC: string | null
          soLuong: number | null
          tenSP: string | null
          thanhTien: number | null
          trangThai: string | null
        }
        Insert: {
          created_at?: string | null
          donGia?: number | null
          donVi?: string | null
          ghiChu?: string | null
          id: string
          lichSu?: Json | null
          loai?: string | null
          loaiKho?: string | null
          lsx?: string | null
          maNV?: string | null
          maSP?: string | null
          ngayDuyet?: string | null
          ngayHoanThanh?: string | null
          ngayTao?: string | null
          nguoiDuyet?: string | null
          nguoiTao?: string | null
          nhaCC?: string | null
          soLuong?: number | null
          tenSP?: string | null
          thanhTien?: number | null
          trangThai?: string | null
        }
        Update: {
          created_at?: string | null
          donGia?: number | null
          donVi?: string | null
          ghiChu?: string | null
          id?: string
          lichSu?: Json | null
          loai?: string | null
          loaiKho?: string | null
          lsx?: string | null
          maNV?: string | null
          maSP?: string | null
          ngayDuyet?: string | null
          ngayHoanThanh?: string | null
          ngayTao?: string | null
          nguoiDuyet?: string | null
          nguoiTao?: string | null
          nhaCC?: string | null
          soLuong?: number | null
          tenSP?: string | null
          thanhTien?: number | null
          trangThai?: string | null
        }
        Relationships: []
      }
      kho_thanh_pham: {
        Row: {
          chi_tiet_size: Json | null
          created_at: string | null
          don_gia: number | null
          ghi_chu: string | null
          gia_ban_le: number | null
          gia_ban_lo: number | null
          gia_ban_si: number | null
          gia_shopee: number
          gia_tiktok: number
          gia_tri: number | null
          gia_von: number | null
          hinh_anh: Json | null
          id: string
          img_quan: string | null
          kenh_ban: string[]
          khach_hang: string | null
          lsx: string | null
          ma_sp: string
          mau: string | null
          ngay_nhap: string | null
          phan_loai: string | null
          size: string | null
          so_luong: number | null
          ten_sp: string | null
          ti_le_size: string | null
          trang_thai: string | null
          updated_at: string | null
          vi_tri: string | null
          video: string | null
        }
        Insert: {
          chi_tiet_size?: Json | null
          created_at?: string | null
          don_gia?: number | null
          ghi_chu?: string | null
          gia_ban_le?: number | null
          gia_ban_lo?: number | null
          gia_ban_si?: number | null
          gia_shopee?: number
          gia_tiktok?: number
          gia_tri?: number | null
          gia_von?: number | null
          hinh_anh?: Json | null
          id: string
          img_quan?: string | null
          kenh_ban?: string[]
          khach_hang?: string | null
          lsx?: string | null
          ma_sp: string
          mau?: string | null
          ngay_nhap?: string | null
          phan_loai?: string | null
          size?: string | null
          so_luong?: number | null
          ten_sp?: string | null
          ti_le_size?: string | null
          trang_thai?: string | null
          updated_at?: string | null
          vi_tri?: string | null
          video?: string | null
        }
        Update: {
          chi_tiet_size?: Json | null
          created_at?: string | null
          don_gia?: number | null
          ghi_chu?: string | null
          gia_ban_le?: number | null
          gia_ban_lo?: number | null
          gia_ban_si?: number | null
          gia_shopee?: number
          gia_tiktok?: number
          gia_tri?: number | null
          gia_von?: number | null
          hinh_anh?: Json | null
          id?: string
          img_quan?: string | null
          kenh_ban?: string[]
          khach_hang?: string | null
          lsx?: string | null
          ma_sp?: string
          mau?: string | null
          ngay_nhap?: string | null
          phan_loai?: string | null
          size?: string | null
          so_luong?: number | null
          ten_sp?: string | null
          ti_le_size?: string | null
          trang_thai?: string | null
          updated_at?: string | null
          vi_tri?: string | null
          video?: string | null
        }
        Relationships: []
      }
      khsx: {
        Row: {
          created_at: string | null
          daHoanThanh: number | null
          denNgay: string | null
          ghiChu: string | null
          id: string
          loai: string | null
          maKHSX: string | null
          ngayTao: string | null
          nguoiTao: string | null
          sanPham: string | null
          soLuong: number | null
          trangThai: string | null
          tuan: string | null
          tuNgay: string | null
          xuongPhuTrach: string | null
        }
        Insert: {
          created_at?: string | null
          daHoanThanh?: number | null
          denNgay?: string | null
          ghiChu?: string | null
          id: string
          loai?: string | null
          maKHSX?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          sanPham?: string | null
          soLuong?: number | null
          trangThai?: string | null
          tuan?: string | null
          tuNgay?: string | null
          xuongPhuTrach?: string | null
        }
        Update: {
          created_at?: string | null
          daHoanThanh?: number | null
          denNgay?: string | null
          ghiChu?: string | null
          id?: string
          loai?: string | null
          maKHSX?: string | null
          ngayTao?: string | null
          nguoiTao?: string | null
          sanPham?: string | null
          soLuong?: number | null
          trangThai?: string | null
          tuan?: string | null
          tuNgay?: string | null
          xuongPhuTrach?: string | null
        }
        Relationships: []
      }
      lenh_cat: {
        Row: {
          bang_cogs: Json | null
          chi_phi_co_dinh: Json | null
          created_at: string | null
          ds_mau: Json | null
          ds_phu_lieu: Json | null
          ghi_chu: string | null
          han_hoan_thanh: string | null
          id: string
          khach_hang: string | null
          loai_lenh: string
          loai_sp: string
          ma_sp: string
          mau_chi_phi: string | null
          mau_cong_doan: string | null
          ngay_tao: string | null
          nguoi_tao: string | null
          phan_cong: Json | null
          phien_ban_dinh_muc: number | null
          phu_trach_cat: string | null
          phu_trach_sx: string | null
          ten_sp: string
          ti_le_size: string | null
          tong_sl: number
          tong_sl_thuc_te: number | null
          trang_thai: string
          updated_at: string | null
        }
        Insert: {
          bang_cogs?: Json | null
          chi_phi_co_dinh?: Json | null
          created_at?: string | null
          ds_mau?: Json | null
          ds_phu_lieu?: Json | null
          ghi_chu?: string | null
          han_hoan_thanh?: string | null
          id: string
          khach_hang?: string | null
          loai_lenh: string
          loai_sp: string
          ma_sp: string
          mau_chi_phi?: string | null
          mau_cong_doan?: string | null
          ngay_tao?: string | null
          nguoi_tao?: string | null
          phan_cong?: Json | null
          phien_ban_dinh_muc?: number | null
          phu_trach_cat?: string | null
          phu_trach_sx?: string | null
          ten_sp: string
          ti_le_size?: string | null
          tong_sl?: number
          tong_sl_thuc_te?: number | null
          trang_thai?: string
          updated_at?: string | null
        }
        Update: {
          bang_cogs?: Json | null
          chi_phi_co_dinh?: Json | null
          created_at?: string | null
          ds_mau?: Json | null
          ds_phu_lieu?: Json | null
          ghi_chu?: string | null
          han_hoan_thanh?: string | null
          id?: string
          khach_hang?: string | null
          loai_lenh?: string
          loai_sp?: string
          ma_sp?: string
          mau_chi_phi?: string | null
          mau_cong_doan?: string | null
          ngay_tao?: string | null
          nguoi_tao?: string | null
          phan_cong?: Json | null
          phien_ban_dinh_muc?: number | null
          phu_trach_cat?: string | null
          phu_trach_sx?: string | null
          ten_sp?: string
          ti_le_size?: string | null
          tong_sl?: number
          tong_sl_thuc_te?: number | null
          trang_thai?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lenh_cat_snapshots: {
        Row: {
          chi_phi_co_dinh_snapshot: Json
          created_at: string | null
          gia_von_binh_quan: number | null
          id: string
          lenh_cat_id: string
          nguoi_chot: string | null
          phan_cong_snapshot: Json
          tong_tien_phu_lieu: number | null
          tong_tien_vai: number | null
        }
        Insert: {
          chi_phi_co_dinh_snapshot?: Json
          created_at?: string | null
          gia_von_binh_quan?: number | null
          id?: string
          lenh_cat_id: string
          nguoi_chot?: string | null
          phan_cong_snapshot?: Json
          tong_tien_phu_lieu?: number | null
          tong_tien_vai?: number | null
        }
        Update: {
          chi_phi_co_dinh_snapshot?: Json
          created_at?: string | null
          gia_von_binh_quan?: number | null
          id?: string
          lenh_cat_id?: string
          nguoi_chot?: string | null
          phan_cong_snapshot?: Json
          tong_tien_phu_lieu?: number | null
          tong_tien_vai?: number | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          email: string | null
          id: string
          ip: string | null
          success: boolean | null
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          email?: string | null
          id: string
          ip?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          ip?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      mau_chi_phi: {
        Row: {
          chi_phi: Json
          created_at: string | null
          id: string
          ten: string
          updated_at: string | null
        }
        Insert: {
          chi_phi?: Json
          created_at?: string | null
          id: string
          ten: string
          updated_at?: string | null
        }
        Update: {
          chi_phi?: Json
          created_at?: string | null
          id?: string
          ten?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mau_cong_doan: {
        Row: {
          created_at: string | null
          gia_cong: Json
          id: string
          ten: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gia_cong?: Json
          id: string
          ten: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gia_cong?: Json
          id?: string
          ten?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meinvoice_config: {
        Row: {
          app_id: string
          created_at: string
          default_template: string | null
          env: string
          id: string
          last_token: string | null
          password_enc: string
          sign_type: number
          tax_code: string
          token_expires_at: string | null
          updated_at: string
          updated_by: string | null
          username: string
        }
        Insert: {
          app_id: string
          created_at?: string
          default_template?: string | null
          env?: string
          id?: string
          last_token?: string | null
          password_enc: string
          sign_type?: number
          tax_code: string
          token_expires_at?: string | null
          updated_at?: string
          updated_by?: string | null
          username: string
        }
        Update: {
          app_id?: string
          created_at?: string
          default_template?: string | null
          env?: string
          id?: string
          last_token?: string | null
          password_enc?: string
          sign_type?: number
          tax_code?: string
          token_expires_at?: string | null
          updated_at?: string
          updated_by?: string | null
          username?: string
        }
        Relationships: []
      }
      mimin_group_agent_config: {
        Row: {
          additional_notes: string | null
          company_products: string | null
          default_moq: number | null
          id: string
          industry_synonyms: string | null
          organization_id: string
          preferred_certifications: string[]
          preferred_regions: string | null
          quality_requirements: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          additional_notes?: string | null
          company_products?: string | null
          default_moq?: number | null
          id?: string
          industry_synonyms?: string | null
          organization_id?: string
          preferred_certifications?: string[]
          preferred_regions?: string | null
          quality_requirements?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          additional_notes?: string | null
          company_products?: string | null
          default_moq?: number | null
          id?: string
          industry_synonyms?: string | null
          organization_id?: string
          preferred_certifications?: string[]
          preferred_regions?: string | null
          quality_requirements?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      nha_cung_cap: {
        Row: {
          cccd: string | null
          cccd_ngay_cap: string | null
          chuyen_mon: string
          cong_no: number
          created_at: string | null
          danh_muc_chi_tiet: string[] | null
          dia_chi: string | null
          don_gia: string | null
          email: string | null
          facebook_url: string | null
          ghi_chu: string | null
          han_muc: number | null
          id: string
          loai: string
          ma_ncc: string
          ma_so_thue: string | null
          ngan_hang: string | null
          nguoi_lh: string | null
          rating: number | null
          sdt: string | null
          so_tai_khoan: string | null
          stt: number
          ten_ncc: string
          trang_thai: string | null
          updated_at: string | null
        }
        Insert: {
          cccd?: string | null
          cccd_ngay_cap?: string | null
          chuyen_mon: string
          cong_no?: number
          created_at?: string | null
          danh_muc_chi_tiet?: string[] | null
          dia_chi?: string | null
          don_gia?: string | null
          email?: string | null
          facebook_url?: string | null
          ghi_chu?: string | null
          han_muc?: number | null
          id?: string
          loai: string
          ma_ncc: string
          ma_so_thue?: string | null
          ngan_hang?: string | null
          nguoi_lh?: string | null
          rating?: number | null
          sdt?: string | null
          so_tai_khoan?: string | null
          stt: number
          ten_ncc: string
          trang_thai?: string | null
          updated_at?: string | null
        }
        Update: {
          cccd?: string | null
          cccd_ngay_cap?: string | null
          chuyen_mon?: string
          cong_no?: number
          created_at?: string | null
          danh_muc_chi_tiet?: string[] | null
          dia_chi?: string | null
          don_gia?: string | null
          email?: string | null
          facebook_url?: string | null
          ghi_chu?: string | null
          han_muc?: number | null
          id?: string
          loai?: string
          ma_ncc?: string
          ma_so_thue?: string | null
          ngan_hang?: string | null
          nguoi_lh?: string | null
          rating?: number | null
          sdt?: string | null
          so_tai_khoan?: string | null
          stt?: number
          ten_ncc?: string
          trang_thai?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nhan_su: {
        Row: {
          avatar: string | null
          avatar_url: string | null
          bhxh: string | null
          bo_phan: string | null
          cccd: string | null
          cccd_back_url: string | null
          cccd_front_url: string | null
          chuc_vu: string | null
          created_at: string | null
          dia_chi_tam_tru: string | null
          dia_chi_tt: string | null
          don_gia_sp: string | null
          email: string | null
          facebook_url: string | null
          ghi_chu: string | null
          gioi_tinh: string | null
          ho_ten: string
          id: string | null
          lan_dang_nhap_cuoi: string | null
          loai_hd: string | null
          loai_luong: string | null
          luong_cb: number | null
          luong_cung: number | null
          ma_dm: string | null
          ma_nv: string
          mst: string | null
          ngan_hang: string | null
          ngay_sinh: string | null
          ngay_tao: string | null
          ngay_vao: string | null
          ngay_vao_lam: string | null
          rating: number | null
          role: string | null
          sdt: string | null
          so_tk: string | null
          stt: number
          tai_khoan: string | null
          tinh_trang_hn: string | null
          trang_thai: string | null
        }
        Insert: {
          avatar?: string | null
          avatar_url?: string | null
          bhxh?: string | null
          bo_phan?: string | null
          cccd?: string | null
          cccd_back_url?: string | null
          cccd_front_url?: string | null
          chuc_vu?: string | null
          created_at?: string | null
          dia_chi_tam_tru?: string | null
          dia_chi_tt?: string | null
          don_gia_sp?: string | null
          email?: string | null
          facebook_url?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          ho_ten: string
          id?: string | null
          lan_dang_nhap_cuoi?: string | null
          loai_hd?: string | null
          loai_luong?: string | null
          luong_cb?: number | null
          luong_cung?: number | null
          ma_dm?: string | null
          ma_nv: string
          mst?: string | null
          ngan_hang?: string | null
          ngay_sinh?: string | null
          ngay_tao?: string | null
          ngay_vao?: string | null
          ngay_vao_lam?: string | null
          rating?: number | null
          role?: string | null
          sdt?: string | null
          so_tk?: string | null
          stt?: number
          tai_khoan?: string | null
          tinh_trang_hn?: string | null
          trang_thai?: string | null
        }
        Update: {
          avatar?: string | null
          avatar_url?: string | null
          bhxh?: string | null
          bo_phan?: string | null
          cccd?: string | null
          cccd_back_url?: string | null
          cccd_front_url?: string | null
          chuc_vu?: string | null
          created_at?: string | null
          dia_chi_tam_tru?: string | null
          dia_chi_tt?: string | null
          don_gia_sp?: string | null
          email?: string | null
          facebook_url?: string | null
          ghi_chu?: string | null
          gioi_tinh?: string | null
          ho_ten?: string
          id?: string | null
          lan_dang_nhap_cuoi?: string | null
          loai_hd?: string | null
          loai_luong?: string | null
          luong_cb?: number | null
          luong_cung?: number | null
          ma_dm?: string | null
          ma_nv?: string
          mst?: string | null
          ngan_hang?: string | null
          ngay_sinh?: string | null
          ngay_tao?: string | null
          ngay_vao?: string | null
          ngay_vao_lam?: string | null
          rating?: number | null
          role?: string | null
          sdt?: string | null
          so_tk?: string | null
          stt?: number
          tai_khoan?: string | null
          tinh_trang_hn?: string | null
          trang_thai?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_users"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      phan_cong: {
        Row: {
          cong_doan: string
          created_at: string | null
          da_thanh_toan: number | null
          don_gia_giao: number
          don_vi: string | null
          ghi_chu: string | null
          id: string
          lenh_cat_id: string
          ngay_giao: string
          ngay_xong_du_kien: string
          nguoi_loai: string | null
          nguoi_ma: string
          nguoi_phu_trach: Json | null
          nguoi_sdt: string | null
          nguoi_ten: string
          so_luong_giao: number
          trang_thai: string | null
          version: number
        }
        Insert: {
          cong_doan: string
          created_at?: string | null
          da_thanh_toan?: number | null
          don_gia_giao: number
          don_vi?: string | null
          ghi_chu?: string | null
          id: string
          lenh_cat_id: string
          ngay_giao: string
          ngay_xong_du_kien: string
          nguoi_loai?: string | null
          nguoi_ma: string
          nguoi_phu_trach?: Json | null
          nguoi_sdt?: string | null
          nguoi_ten: string
          so_luong_giao: number
          trang_thai?: string | null
          version?: number
        }
        Update: {
          cong_doan?: string
          created_at?: string | null
          da_thanh_toan?: number | null
          don_gia_giao?: number
          don_vi?: string | null
          ghi_chu?: string | null
          id?: string
          lenh_cat_id?: string
          ngay_giao?: string
          ngay_xong_du_kien?: string
          nguoi_loai?: string | null
          nguoi_ma?: string
          nguoi_phu_trach?: Json | null
          nguoi_sdt?: string | null
          nguoi_ten?: string
          so_luong_giao?: number
          trang_thai?: string | null
          version?: number
        }
        Relationships: []
      }
      production_company_audit_events: {
        Row: {
          actor_id: string | null
          company_profile_id: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          event_key: string
          event_type: string
          id: string
          occurred_at: string
          organization_id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          company_profile_id: string
          created_at?: string
          details?: Json
          entity_id: string
          entity_type: string
          event_key?: string
          event_type: string
          id?: string
          occurred_at?: string
          organization_id?: string
          title: string
        }
        Update: {
          actor_id?: string | null
          company_profile_id?: string
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          event_key?: string
          event_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_audit_events_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_document_extractions: {
        Row: {
          confidence: number
          created_at: string
          created_by: string
          document_id: string
          document_number: string | null
          expires_on: string | null
          extraction_status: string
          id: string
          issued_on: string | null
          issuer: string | null
          legal_name: string | null
          legal_representative: string | null
          model: string
          organization_id: string
          provider: string
          raw_text_excerpt: string | null
          registered_address: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          summary: string | null
          tax_code: string | null
        }
        Insert: {
          confidence?: number
          created_at?: string
          created_by?: string
          document_id: string
          document_number?: string | null
          expires_on?: string | null
          extraction_status?: string
          id?: string
          issued_on?: string | null
          issuer?: string | null
          legal_name?: string | null
          legal_representative?: string | null
          model: string
          organization_id?: string
          provider?: string
          raw_text_excerpt?: string | null
          registered_address?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          tax_code?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          created_by?: string
          document_id?: string
          document_number?: string | null
          expires_on?: string | null
          extraction_status?: string
          id?: string
          issued_on?: string | null
          issuer?: string | null
          legal_name?: string | null
          legal_representative?: string | null
          model?: string
          organization_id?: string
          provider?: string
          raw_text_excerpt?: string | null
          registered_address?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string | null
          tax_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_company_document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "production_company_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_documents: {
        Row: {
          company_profile_id: string
          created_at: string
          document_number: string | null
          document_type: string
          expires_on: string | null
          file_bytes: number
          id: string
          issued_on: string | null
          issuer: string | null
          mime_type: string
          notes: string | null
          organization_id: string
          original_filename: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          storage_bucket: string
          storage_path: string
          title: string
          uploaded_by: string
        }
        Insert: {
          company_profile_id: string
          created_at?: string
          document_number?: string | null
          document_type: string
          expires_on?: string | null
          file_bytes: number
          id?: string
          issued_on?: string | null
          issuer?: string | null
          mime_type: string
          notes?: string | null
          organization_id?: string
          original_filename: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_bucket?: string
          storage_path: string
          title: string
          uploaded_by?: string
        }
        Update: {
          company_profile_id?: string
          created_at?: string
          document_number?: string | null
          document_type?: string
          expires_on?: string | null
          file_bytes?: number
          id?: string
          issued_on?: string | null
          issuer?: string | null
          mime_type?: string
          notes?: string | null
          organization_id?: string
          original_filename?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_bucket?: string
          storage_path?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_documents_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_field_evidence: {
        Row: {
          captured_at: string
          company_profile_id: string
          confidence: number
          created_at: string
          created_by: string
          field_name: string
          field_value: string
          id: string
          normalized_value: string
          organization_id: string
          provider: string
          source_url: string
          tax_code: string
          updated_at: string
          updated_by: string
          verification_status: string
        }
        Insert: {
          captured_at?: string
          company_profile_id: string
          confidence: number
          created_at?: string
          created_by?: string
          field_name: string
          field_value: string
          id?: string
          normalized_value: string
          organization_id?: string
          provider: string
          source_url: string
          tax_code: string
          updated_at?: string
          updated_by?: string
          verification_status?: string
        }
        Update: {
          captured_at?: string
          company_profile_id?: string
          confidence?: number
          created_at?: string
          created_by?: string
          field_name?: string
          field_value?: string
          id?: string
          normalized_value?: string
          organization_id?: string
          provider?: string
          source_url?: string
          tax_code?: string
          updated_at?: string
          updated_by?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_field_evidence_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_images: {
        Row: {
          archival_status: string
          archived_at: string | null
          archived_bytes: number | null
          archived_mime_type: string | null
          caption: string | null
          company_profile_id: string
          created_at: string
          created_by: string | null
          id: string
          image_category: string
          image_url: string
          is_primary: boolean
          match_score: number
          organization_id: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_page_url: string
          source_provider: string
          source_title: string | null
          storage_bucket: string | null
          storage_path: string | null
        }
        Insert: {
          archival_status?: string
          archived_at?: string | null
          archived_bytes?: number | null
          archived_mime_type?: string | null
          caption?: string | null
          company_profile_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_category?: string
          image_url: string
          is_primary?: boolean
          match_score?: number
          organization_id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_page_url: string
          source_provider?: string
          source_title?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
        }
        Update: {
          archival_status?: string
          archived_at?: string | null
          archived_bytes?: number | null
          archived_mime_type?: string | null
          caption?: string | null
          company_profile_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_category?: string
          image_url?: string
          is_primary?: boolean
          match_score?: number
          organization_id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_page_url?: string
          source_provider?: string
          source_title?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_company_images_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_manual_checks: {
        Row: {
          check_status: string
          check_type: string
          checked_at: string
          checked_by: string
          company_profile_id: string
          created_at: string
          id: string
          notes: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          check_status?: string
          check_type: string
          checked_at?: string
          checked_by?: string
          company_profile_id: string
          created_at?: string
          id?: string
          notes?: string
          organization_id?: string
          updated_at?: string
        }
        Update: {
          check_status?: string
          check_type?: string
          checked_at?: string
          checked_by?: string
          company_profile_id?: string
          created_at?: string
          id?: string
          notes?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_manual_checks_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_profiles: {
        Row: {
          address: string | null
          capabilities: string[]
          created_at: string
          created_by: string | null
          discovery_candidate_id: string | null
          district: string | null
          email: string | null
          id: string
          identity_key: string
          latitude: number | null
          legal_name: string
          longitude: number | null
          organization_id: string
          partner_id: string | null
          phone: string | null
          profile_status: string
          province: string | null
          raw_data: Json
          role: string
          source_provider: string | null
          source_url: string | null
          summary: string | null
          tax_code: string | null
          updated_at: string
          updated_by: string | null
          verification_status: string
          website: string | null
        }
        Insert: {
          address?: string | null
          capabilities?: string[]
          created_at?: string
          created_by?: string | null
          discovery_candidate_id?: string | null
          district?: string | null
          email?: string | null
          id?: string
          identity_key: string
          latitude?: number | null
          legal_name: string
          longitude?: number | null
          organization_id?: string
          partner_id?: string | null
          phone?: string | null
          profile_status?: string
          province?: string | null
          raw_data?: Json
          role: string
          source_provider?: string | null
          source_url?: string | null
          summary?: string | null
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          capabilities?: string[]
          created_at?: string
          created_by?: string | null
          discovery_candidate_id?: string | null
          district?: string | null
          email?: string | null
          id?: string
          identity_key?: string
          latitude?: number | null
          legal_name?: string
          longitude?: number | null
          organization_id?: string
          partner_id?: string | null
          phone?: string | null
          profile_status?: string
          province?: string | null
          raw_data?: Json
          role?: string
          source_provider?: string | null
          source_url?: string | null
          summary?: string | null
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_company_profiles_discovery_candidate_id_fkey"
            columns: ["discovery_candidate_id"]
            isOneToOne: false
            referencedRelation: "production_discovery_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_company_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "production_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_registry_cache: {
        Row: {
          business_type: string
          created_at: string
          created_by: string
          expires_at: string
          fetched_at: string
          id: string
          international_name: string
          legal_name: string
          lookup_status: string
          main_business_line: string
          managing_tax_authority: string
          operation_date: string | null
          organization_id: string
          payload_hash: string
          phone: string
          provider: string
          raw_payload: Json
          registered_address: string
          representative_name: string
          response_code: string
          short_name: string
          source_updated_at: string | null
          source_url: string
          tax_code: string
          taxpayer_status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          created_by?: string
          expires_at: string
          fetched_at?: string
          id?: string
          international_name?: string
          legal_name?: string
          lookup_status: string
          main_business_line?: string
          managing_tax_authority?: string
          operation_date?: string | null
          organization_id?: string
          payload_hash: string
          phone?: string
          provider: string
          raw_payload?: Json
          registered_address?: string
          representative_name?: string
          response_code?: string
          short_name?: string
          source_updated_at?: string | null
          source_url: string
          tax_code: string
          taxpayer_status?: string
          updated_at?: string
          updated_by?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          international_name?: string
          legal_name?: string
          lookup_status?: string
          main_business_line?: string
          managing_tax_authority?: string
          operation_date?: string | null
          organization_id?: string
          payload_hash?: string
          phone?: string
          provider?: string
          raw_payload?: Json
          registered_address?: string
          representative_name?: string
          response_code?: string
          short_name?: string
          source_updated_at?: string | null
          source_url?: string
          tax_code?: string
          taxpayer_status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      production_company_registry_field_reviews: {
        Row: {
          company_profile_id: string
          decision: string
          evidence_snapshot: Json
          field_name: string
          id: string
          note: string
          organization_id: string
          reconciliation_id: string
          reviewed_at: string
          reviewed_by: string
          selected_value: string | null
          tax_code: string
        }
        Insert: {
          company_profile_id: string
          decision: string
          evidence_snapshot: Json
          field_name: string
          id?: string
          note?: string
          organization_id?: string
          reconciliation_id: string
          reviewed_at?: string
          reviewed_by: string
          selected_value?: string | null
          tax_code: string
        }
        Update: {
          company_profile_id?: string
          decision?: string
          evidence_snapshot?: Json
          field_name?: string
          id?: string
          note?: string
          organization_id?: string
          reconciliation_id?: string
          reviewed_at?: string
          reviewed_by?: string
          selected_value?: string | null
          tax_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_registry_field_revie_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_company_registry_field_review_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "production_company_registry_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_registry_reconciliations: {
        Row: {
          company_profile_id: string
          conflict_fields: number
          created_at: string
          created_by: string
          field_results: Json
          formula_version: string
          id: string
          match_score: number
          matched_fields: number
          missing_fields: number
          organization_id: string
          overall_status: string
          partial_fields: number
          source_snapshot: Json
          tax_code: string
        }
        Insert: {
          company_profile_id: string
          conflict_fields?: number
          created_at?: string
          created_by?: string
          field_results: Json
          formula_version?: string
          id?: string
          match_score: number
          matched_fields?: number
          missing_fields?: number
          organization_id?: string
          overall_status: string
          partial_fields?: number
          source_snapshot: Json
          tax_code: string
        }
        Update: {
          company_profile_id?: string
          conflict_fields?: number
          created_at?: string
          created_by?: string
          field_results?: Json
          formula_version?: string
          id?: string
          match_score?: number
          matched_fields?: number
          missing_fields?: number
          organization_id?: string
          overall_status?: string
          partial_fields?: number
          source_snapshot?: Json
          tax_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_registry_reconciliat_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_registry_verification_packets: {
        Row: {
          company_profile_id: string
          finalized_at: string
          finalized_by: string
          id: string
          note: string
          organization_id: string
          packet_status: string
          reconciliation_id: string
          review_count: number
          review_snapshot: Json
          selected_fields: Json
          tax_code: string
        }
        Insert: {
          company_profile_id: string
          finalized_at?: string
          finalized_by: string
          id?: string
          note?: string
          organization_id?: string
          packet_status: string
          reconciliation_id: string
          review_count: number
          review_snapshot: Json
          selected_fields: Json
          tax_code: string
        }
        Update: {
          company_profile_id?: string
          finalized_at?: string
          finalized_by?: string
          id?: string
          note?: string
          organization_id?: string
          packet_status?: string
          reconciliation_id?: string
          review_count?: number
          review_snapshot?: Json
          selected_fields?: Json
          tax_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_registry_verificatio_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_company_registry_verification_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "production_company_registry_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_sources: {
        Row: {
          captured_at: string
          company_profile_id: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          source_provider: string | null
          source_title: string | null
          source_type: string
          source_url: string
          verification_status: string
        }
        Insert: {
          captured_at?: string
          company_profile_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          source_provider?: string | null
          source_title?: string | null
          source_type?: string
          source_url: string
          verification_status?: string
        }
        Update: {
          captured_at?: string
          company_profile_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          source_provider?: string | null
          source_title?: string | null
          source_type?: string
          source_url?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_sources_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_trust_assessments: {
        Row: {
          assessed_at: string
          assessed_by: string
          assessment_label: string
          base_score: number
          company_profile_id: string
          coverage: number
          evidence_summary: Json
          factors: Json
          formula_version: string
          id: string
          note: string
          organization_id: string
          penalties: Json
          penalty_total: number
          risk_level: string
          score: number
        }
        Insert: {
          assessed_at?: string
          assessed_by?: string
          assessment_label: string
          base_score: number
          company_profile_id: string
          coverage: number
          evidence_summary?: Json
          factors: Json
          formula_version: string
          id?: string
          note?: string
          organization_id?: string
          penalties?: Json
          penalty_total: number
          risk_level: string
          score: number
        }
        Update: {
          assessed_at?: string
          assessed_by?: string
          assessment_label?: string
          base_score?: number
          company_profile_id?: string
          coverage?: number
          evidence_summary?: Json
          factors?: Json
          formula_version?: string
          id?: string
          note?: string
          organization_id?: string
          penalties?: Json
          penalty_total?: number
          risk_level?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_company_trust_assessments_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "production_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_discovery_candidates: {
        Row: {
          address: string | null
          discovered_at: string
          discovered_by: string | null
          district: string | null
          external_id: string
          id: string
          latitude: number | null
          legal_name: string
          longitude: number | null
          matched_partner_id: string | null
          organization_id: string
          phone: string | null
          province: string | null
          raw_data: Json
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          search_query: string
          source_provider: string
          source_url: string
          status: string
          website: string | null
        }
        Insert: {
          address?: string | null
          discovered_at?: string
          discovered_by?: string | null
          district?: string | null
          external_id: string
          id?: string
          latitude?: number | null
          legal_name: string
          longitude?: number | null
          matched_partner_id?: string | null
          organization_id?: string
          phone?: string | null
          province?: string | null
          raw_data?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: string
          search_query: string
          source_provider: string
          source_url: string
          status?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          discovered_at?: string
          discovered_by?: string | null
          district?: string | null
          external_id?: string
          id?: string
          latitude?: number | null
          legal_name?: string
          longitude?: number | null
          matched_partner_id?: string | null
          organization_id?: string
          phone?: string | null
          province?: string | null
          raw_data?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string
          search_query?: string
          source_provider?: string
          source_url?: string
          status?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_discovery_candidates_matched_partner_id_fkey"
            columns: ["matched_partner_id"]
            isOneToOne: false
            referencedRelation: "production_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      production_geocode_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          fetched_at: string
          id: string
          last_used_at: string
          normalized_query: string
          organization_id: string
          places: Json
          provider: string
          result_count: number
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          fetched_at?: string
          id?: string
          last_used_at?: string
          normalized_query: string
          organization_id?: string
          places?: Json
          provider?: string
          result_count?: number
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          last_used_at?: string
          normalized_query?: string
          organization_id?: string
          places?: Json
          provider?: string
          result_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      production_partner_rfqs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          partner_id: string
          quantity: number | null
          quoted_price: number | null
          requirement: string
          response_deadline: string | null
          response_notes: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          partner_id: string
          quantity?: number | null
          quoted_price?: number | null
          requirement: string
          response_deadline?: string | null
          response_notes?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          partner_id?: string
          quantity?: number | null
          quoted_price?: number | null
          requirement?: string
          response_deadline?: string | null
          response_notes?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_partner_rfqs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "production_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      production_partner_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          partner_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string
          partner_id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          partner_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_partner_roles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "production_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      production_partners: {
        Row: {
          address: string | null
          capabilities: string[]
          capacity_per_month: number | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          district: string | null
          email: string | null
          id: string
          latitude: number | null
          lead_time_days: number | null
          legal_name: string
          longitude: number | null
          minimum_order_quantity: number | null
          notes: string | null
          organization_id: string
          partner_code: string
          phone: string | null
          province: string | null
          quality_score: number | null
          reliability_score: number | null
          service_radius_km: number | null
          status: string
          tax_code: string | null
          updated_at: string
          updated_by: string | null
          verification_status: string
          website: string | null
        }
        Insert: {
          address?: string | null
          capabilities?: string[]
          capacity_per_month?: number | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          lead_time_days?: number | null
          legal_name: string
          longitude?: number | null
          minimum_order_quantity?: number | null
          notes?: string | null
          organization_id?: string
          partner_code: string
          phone?: string | null
          province?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          service_radius_km?: number | null
          status?: string
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          capabilities?: string[]
          capacity_per_month?: number | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          lead_time_days?: number | null
          legal_name?: string
          longitude?: number | null
          minimum_order_quantity?: number | null
          notes?: string | null
          organization_id?: string
          partner_code?: string
          phone?: string | null
          province?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          service_radius_km?: number | null
          status?: string
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string | null
          user_id: string | null
        }
        Insert: {
          auth?: string | null
          created_at?: string | null
          endpoint: string
          id: string
          p256dh?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_push_subs_users"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_records: {
        Row: {
          congDoan: string | null
          created_at: string | null
          ghiChu: string | null
          id: string
          lenhSX: string | null
          lichSu: Json | null
          loi: Json | null
          maSP: string | null
          ngayHoanThanh: string | null
          ngayKiem: string | null
          nguoiKiem: string | null
          nguoiThucHien: string | null
          phanLoai: string | null
          soLuongDat: number | null
          soLuongGiao: number | null
          soLuongKiem: number | null
          soLuongLoi: number | null
          taskId: string | null
          tiLeDat: number | null
          trangThai: string | null
        }
        Insert: {
          congDoan?: string | null
          created_at?: string | null
          ghiChu?: string | null
          id: string
          lenhSX?: string | null
          lichSu?: Json | null
          loi?: Json | null
          maSP?: string | null
          ngayHoanThanh?: string | null
          ngayKiem?: string | null
          nguoiKiem?: string | null
          nguoiThucHien?: string | null
          phanLoai?: string | null
          soLuongDat?: number | null
          soLuongGiao?: number | null
          soLuongKiem?: number | null
          soLuongLoi?: number | null
          taskId?: string | null
          tiLeDat?: number | null
          trangThai?: string | null
        }
        Update: {
          congDoan?: string | null
          created_at?: string | null
          ghiChu?: string | null
          id?: string
          lenhSX?: string | null
          lichSu?: Json | null
          loi?: Json | null
          maSP?: string | null
          ngayHoanThanh?: string | null
          ngayKiem?: string | null
          nguoiKiem?: string | null
          nguoiThucHien?: string | null
          phanLoai?: string | null
          soLuongDat?: number | null
          soLuongGiao?: number | null
          soLuongKiem?: number | null
          soLuongLoi?: number | null
          taskId?: string | null
          tiLeDat?: number | null
          trangThai?: string | null
        }
        Relationships: []
      }
      san_pham: {
        Row: {
          bang_size: Json | null
          chat_lieu: string | null
          created_at: string | null
          da_ban: number | null
          dinh_muc: number | null
          ds_mau: Json | null
          gia_ban_du_kien: number | null
          gia_von_du_kien: number | null
          hinh_anh: string | null
          id: string
          loai_sp: string
          luot_xem: number | null
          ma_dm: string
          ma_sp: string
          mo_ta_ngan: string | null
          ncc: string | null
          rating: number | null
          ten_sp: string
          ti_le_size: string | null
          ton_kho: number | null
          trang_thai: string | null
        }
        Insert: {
          bang_size?: Json | null
          chat_lieu?: string | null
          created_at?: string | null
          da_ban?: number | null
          dinh_muc?: number | null
          ds_mau?: Json | null
          gia_ban_du_kien?: number | null
          gia_von_du_kien?: number | null
          hinh_anh?: string | null
          id?: string
          loai_sp: string
          luot_xem?: number | null
          ma_dm: string
          ma_sp: string
          mo_ta_ngan?: string | null
          ncc?: string | null
          rating?: number | null
          ten_sp: string
          ti_le_size?: string | null
          ton_kho?: number | null
          trang_thai?: string | null
        }
        Update: {
          bang_size?: Json | null
          chat_lieu?: string | null
          created_at?: string | null
          da_ban?: number | null
          dinh_muc?: number | null
          ds_mau?: Json | null
          gia_ban_du_kien?: number | null
          gia_von_du_kien?: number | null
          hinh_anh?: string | null
          id?: string
          loai_sp?: string
          luot_xem?: number | null
          ma_dm?: string
          ma_sp?: string
          mo_ta_ngan?: string | null
          ncc?: string | null
          rating?: number | null
          ten_sp?: string
          ti_le_size?: string | null
          ton_kho?: number | null
          trang_thai?: string | null
        }
        Relationships: []
      }
      search_profiles: {
        Row: {
          code: string
          config: Json
          created_at: string
          created_by: string | null
          entity_type: string
          id: string
          intent: string
          name: string
          organization_id: string
          scoring_profile: Json
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          created_by?: string | null
          entity_type: string
          id?: string
          intent: string
          name: string
          organization_id?: string
          scoring_profile?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          entity_type?: string
          id?: string
          intent?: string
          name?: string
          organization_id?: string
          scoring_profile?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      so_do_chien_luoc: {
        Row: {
          created_at: string
          created_by: string | null
          edges: Json | null
          id: string
          name: string
          nodes: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          edges?: Json | null
          id: string
          name: string
          nodes?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          edges?: Json | null
          id?: string
          name?: string
          nodes?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      time_bounds: {
        Row: {
          bounds: Json | null
          created_at: string | null
          id: string
          module: string
        }
        Insert: {
          bounds?: Json | null
          created_at?: string | null
          id: string
          module: string
        }
        Update: {
          bounds?: Json | null
          created_at?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      two_factor_configs: {
        Row: {
          backup_codes: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          secret: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id: string
          secret?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          secret?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          chucVu: string | null
          created_at: string | null
          donGia: number | null
          email: string
          id: string
          isActive: boolean | null
          laCongNhan: boolean | null
          lastLogin: string | null
          loginCount: number | null
          maNV: string | null
          name: string
          phongBan: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          chucVu?: string | null
          created_at?: string | null
          donGia?: number | null
          email: string
          id: string
          isActive?: boolean | null
          laCongNhan?: boolean | null
          lastLogin?: string | null
          loginCount?: number | null
          maNV?: string | null
          name: string
          phongBan?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          chucVu?: string | null
          created_at?: string | null
          donGia?: number | null
          email?: string
          id?: string
          isActive?: boolean | null
          laCongNhan?: boolean | null
          lastLogin?: string | null
          loginCount?: number | null
          maNV?: string | null
          name?: string
          phongBan?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vat_tu: {
        Row: {
          created_at: string | null
          don_gia_mac_dinh: number | null
          don_vi_tinh: string
          ghi_chu: string | null
          loai_vat_tu: string
          ma_vt: string
          mau_sac: string | null
          ten_vt: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          don_gia_mac_dinh?: number | null
          don_vi_tinh: string
          ghi_chu?: string | null
          loai_vat_tu: string
          ma_vt: string
          mau_sac?: string | null
          ten_vt: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          don_gia_mac_dinh?: number | null
          don_vi_tinh?: string
          ghi_chu?: string | null
          loai_vat_tu?: string
          ma_vt?: string
          mau_sac?: string | null
          ten_vt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      xuong_gia_cong: {
        Row: {
          con_lai: number | null
          cong_no: number | null
          cong_suat: string | null
          created_at: string | null
          da_thanh_toan: number | null
          dia_chi: string | null
          don_gia_tb: number | null
          don_vi: string | null
          email: string | null
          ghi_chu: string | null
          han_muc_no: number | null
          id: string
          loai: string | null
          ma_xuong: string
          ngay_hop_tac: string | null
          nguoi_lh: string | null
          phuong_thuc_tt: string | null
          rating: number | null
          sdt: string | null
          ten_xuong: string
          thoi_han_thanh_toan: number | null
          trang_thai: string | null
          updated_at: string | null
        }
        Insert: {
          con_lai?: number | null
          cong_no?: number | null
          cong_suat?: string | null
          created_at?: string | null
          da_thanh_toan?: number | null
          dia_chi?: string | null
          don_gia_tb?: number | null
          don_vi?: string | null
          email?: string | null
          ghi_chu?: string | null
          han_muc_no?: number | null
          id?: string
          loai?: string | null
          ma_xuong: string
          ngay_hop_tac?: string | null
          nguoi_lh?: string | null
          phuong_thuc_tt?: string | null
          rating?: number | null
          sdt?: string | null
          ten_xuong: string
          thoi_han_thanh_toan?: number | null
          trang_thai?: string | null
          updated_at?: string | null
        }
        Update: {
          con_lai?: number | null
          cong_no?: number | null
          cong_suat?: string | null
          created_at?: string | null
          da_thanh_toan?: number | null
          dia_chi?: string | null
          don_gia_tb?: number | null
          don_vi?: string | null
          email?: string | null
          ghi_chu?: string | null
          han_muc_no?: number | null
          id?: string
          loai?: string | null
          ma_xuong?: string
          ngay_hop_tac?: string | null
          nguoi_lh?: string | null
          phuong_thuc_tt?: string | null
          rating?: number | null
          sdt?: string | null
          ten_xuong?: string
          thoi_han_thanh_toan?: number | null
          trang_thai?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      agent_daily_stats: {
        Row: {
          agent_id: string | null
          avg_latency_ms: number | null
          call_count: number | null
          date: string | null
          error_count: number | null
          success_count: number | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_tokens: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      kho_phu_lieu: {
        Row: {
          created_at: string | null
          don_gia: number | null
          dvt: string | null
          ghi_chu: string | null
          id: string | null
          kho: string | null
          loai: string | null
          loai_chi_tiet: string | null
          ma_ncc: string | null
          mau_sac: string | null
          sku: string | null
          so_cay_nhap: number | null
          ten_vt: string | null
          ton_cay: number | null
          ton_kho: number | null
          ton_toi_thieu: number | null
          ty_le_hao_hut: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          don_gia?: number | null
          dvt?: string | null
          ghi_chu?: string | null
          id?: string | null
          kho?: string | null
          loai?: string | null
          loai_chi_tiet?: string | null
          ma_ncc?: string | null
          mau_sac?: string | null
          sku?: string | null
          so_cay_nhap?: number | null
          ten_vt?: string | null
          ton_cay?: number | null
          ton_kho?: number | null
          ton_toi_thieu?: number | null
          ty_le_hao_hut?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          don_gia?: number | null
          dvt?: string | null
          ghi_chu?: string | null
          id?: string | null
          kho?: string | null
          loai?: string | null
          loai_chi_tiet?: string | null
          ma_ncc?: string | null
          mau_sac?: string | null
          sku?: string | null
          so_cay_nhap?: number | null
          ten_vt?: string | null
          ton_cay?: number | null
          ton_kho?: number | null
          ton_toi_thieu?: number | null
          ty_le_hao_hut?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kho_vai: {
        Row: {
          created_at: string | null
          don_gia: number | null
          dvt: string | null
          ghi_chu: string | null
          id: string | null
          kho: string | null
          loai: string | null
          loai_chi_tiet: string | null
          ma_ncc: string | null
          mau_sac: string | null
          sku: string | null
          so_cay_nhap: number | null
          ten_vt: string | null
          ton_cay: number | null
          ton_kho: number | null
          ton_toi_thieu: number | null
          ty_le_hao_hut: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          don_gia?: number | null
          dvt?: string | null
          ghi_chu?: string | null
          id?: string | null
          kho?: string | null
          loai?: string | null
          loai_chi_tiet?: string | null
          ma_ncc?: string | null
          mau_sac?: string | null
          sku?: string | null
          so_cay_nhap?: number | null
          ten_vt?: string | null
          ton_cay?: number | null
          ton_kho?: number | null
          ton_toi_thieu?: number | null
          ty_le_hao_hut?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          don_gia?: number | null
          dvt?: string | null
          ghi_chu?: string | null
          id?: string | null
          kho?: string | null
          loai?: string | null
          loai_chi_tiet?: string | null
          ma_ncc?: string | null
          mau_sac?: string | null
          sku?: string | null
          so_cay_nhap?: number | null
          ten_vt?: string | null
          ton_cay?: number | null
          ton_kho?: number | null
          ton_toi_thieu?: number | null
          ty_le_hao_hut?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_production_candidate: {
        Args: { p_candidate_id: string }
        Returns: string
      }
      increment_version: {
        Args: { p_id: string; p_table: string }
        Returns: number
      }
      save_production_partner: {
        Args: {
          p_address: string
          p_capabilities: string[]
          p_capacity_per_month: number
          p_contact_name: string
          p_district: string
          p_email: string
          p_id: string
          p_latitude: number
          p_lead_time_days: number
          p_legal_name: string
          p_longitude: number
          p_minimum_order_quantity: number
          p_notes: string
          p_partner_code: string
          p_phone: string
          p_province: string
          p_quality_score: number
          p_reliability_score: number
          p_roles: string[]
          p_service_radius_km: number
          p_status: string
          p_tax_code: string
          p_verification_status: string
          p_website: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
