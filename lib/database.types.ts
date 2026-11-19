export type Database = {
  public: {
    Tables: {
      sets: {
        Row: {
          id: string;
          title: string;
          subtitle: string;
          published_at: string;
          duration_label: string;
          genre: string;
          cover_url: string;
          cover_path: string | null;
          audio_url: string;
          audio_key: string | null;
          featured: boolean;
          published: boolean;
        };
        Insert: {
          id: string;
          title: string;
          subtitle?: string;
          published_at?: string;
          duration_label?: string;
          genre?: string;
          cover_url: string;
          cover_path?: string | null;
          audio_url?: string;
          audio_key?: string | null;
          featured?: boolean;
          published?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string;
          published_at?: string;
          duration_label?: string;
          genre?: string;
          cover_url?: string;
          cover_path?: string | null;
          audio_url?: string;
          audio_key?: string | null;
          featured?: boolean;
          published?: boolean;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: boolean;
          bio: string;
          artist_image_url: string;
          artist_image_path: string;
          contact_email: string;
          instagram_url: string;
          soundcloud_url: string;
          mixcloud_url: string;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          bio?: string;
          artist_image_url?: string;
          artist_image_path?: string;
          contact_email?: string;
          instagram_url?: string;
          soundcloud_url?: string;
          mixcloud_url?: string;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          bio?: string;
          artist_image_url?: string;
          artist_image_path?: string;
          contact_email?: string;
          instagram_url?: string;
          soundcloud_url?: string;
          mixcloud_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_admins: {
        Row: { email: string };
        Insert: { email: string };
        Update: { email?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_site_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
