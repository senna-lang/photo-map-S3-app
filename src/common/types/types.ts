export type LngLat = {
  lng: number | null;
  lat: number | null;
};
export type Album = {
  coordinate: {
    lng: number;
    lat: number;
  } | null;
  created_at: string;
  id: number;
  image_url: string | null;
  user_id: string | null;
};
