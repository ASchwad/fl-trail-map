export type TrailStatusValue = "Open" | "Limited" | "Closed";

export interface Database {
  public: {
    Tables: {
      trails: {
        Row: {
          id: string;
          trail_number: string | null;
          slug: string;
          outdooractive_id: number | null;
          full_name: string;
          name: string;
          area: string | null;
          region: string;
          category_code: string | null;
          category: string | null;
          difficulty_technical: string | null;
          difficulty_overall: string | null;
          elevation_highest: number | null;
          elevation_lowest: number | null;
          elevation_ascent: number | null;
          elevation_descent: number | null;
          distance_km: number | null;
          duration_minutes: number | null;
          description_short: string | null;
          gpx_file: string | null;
          marker_lat: number | null;
          marker_lng: number | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trails"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["trails"]["Insert"]>;
      };
      trail_status: {
        Row: {
          id: string;
          trail_id: string;
          status: TrailStatusValue;
          status_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trail_status"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["trail_status"]["Insert"]>;
      };
    };
    Views: {
      trails_with_status: {
        Row: Database["public"]["Tables"]["trails"]["Row"] & {
          current_status: TrailStatusValue | "Unknown";
          status_date: string | null;
          status_notes: string | null;
        };
      };
      trail_status_daily: {
        Row: {
          trail_id: string;
          day: string;
          samples: number;
          open_samples: number;
          limited_samples: number;
          closed_samples: number;
        };
      };
    };
  };
}

export type Trail = Database["public"]["Views"]["trails_with_status"]["Row"];
export type TrailInsert = Database["public"]["Tables"]["trails"]["Insert"];
export type TrailStatus = Database["public"]["Tables"]["trail_status"]["Row"];
