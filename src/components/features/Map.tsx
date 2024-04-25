'use client';

import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef,useState } from 'react';
import { Album, LngLat } from '@/common/types/types';
import { Marker } from 'react-map-gl';
import GeoMarker from '../elements/Marker';

const Mapbox = ({ album }: { album: Album[] | null }) => {
  const [lngLat, setLngLat] = useState<LngLat>({
    lng: null,
    lat: null,
  });

  const markedMap = (e: any) => {
    setLngLat({ ...lngLat, lng: e.lngLat.lng, lat: e.lngLat.lat });
  };

  return (
    <Map
      id="map"
      initialViewState={{
        longitude: 137.760725,
        latitude: 38.152981,
        zoom: 5,
      }}
      style={{ width: '100%', height: '100vh' }}
      onClick={e => markedMap(e)}
      mapStyle="mapbox://styles/senna-lang/clvaj709a00p901q13orl1h14"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAP_BOX_ACCESS_KEY}
    >
      {album?.map((data: Album) => (
        <GeoMarker data={data} key={data.id} />
      ))}
      {/* <Marker
        longitude={lngLat.lng!}
        latitude={lngLat.lat!}
        anchor="bottom"
      /> */}
    </Map>
  );
};

export default Mapbox;
