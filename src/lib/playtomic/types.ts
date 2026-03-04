export interface PlaytomicTenant {
  tenant_id: string;
  tenant_name: string;
  address: {
    city: string;
    coordinate: { lat: number; lon: number };
    timezone: string;
  };
}

export interface PlaytomicPlayer {
  name: string;
  level_value: number | null;
}

export interface PlaytomicTeam {
  team_id: string;
  players: PlaytomicPlayer[];
  max_players: number;
}

export interface PlaytomicMatch {
  match_id: string;
  location: string;
  start_date: string; // "2026-03-18T14:00:00" — Berlin local time, no TZ
  end_date: string;
  status: string;
  gender: string | null; // "ALL" | "MALE" | "FEMALE" | "MIXED" | null
  min_level: number | null;
  max_level: number | null;
  teams: PlaytomicTeam[];
  tenant: PlaytomicTenant;
  resource_properties: {
    resource_type: string; // "indoor" | "outdoor"
    resource_size: string;
    resource_feature: string;
  } | null;
}
