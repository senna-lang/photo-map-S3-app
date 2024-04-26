export type LngLat = {
  lng: number | null;
  lat: number | null;
};
export type Album = {
  coordinate: {
    lng: number;
    lat: number;
  } ;
  created_at: string;
  id: number;
  image_url: string ;
  user_id: string;
};
