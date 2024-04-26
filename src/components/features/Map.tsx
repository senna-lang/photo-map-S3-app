'use client';

import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Album, LngLat } from '@/common/types/types';
import { Marker } from 'react-map-gl';
import GeoMarker from '../elements/Marker';
import { useStore } from '@/common/store/store';

const Mapbox = ({ album }: { album: Album[] | null }) => {
  const { coordinate, updateCoordinate,showPinnedMarker } = useStore();

  return (
    <Map
      id="map"
      initialViewState={{
        longitude: 137.760725,
        latitude: 38.152981,
        zoom: 5,
      }}
      style={{ width: '100%', height: '100vh' }}
      onClick={e => updateCoordinate({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
      mapStyle="mapbox://styles/senna-lang/clvaj709a00p901q13orl1h14"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAP_BOX_ACCESS_KEY}
    >
      {album?.map((data: Album) => (
        <GeoMarker data={data} key={data.id} />
      ))}
      {showPinnedMarker&&(<Marker
        longitude={coordinate.lng!}
        latitude={coordinate.lat!}
        anchor="bottom"
      />)}     
    </Map>
  );
};

export default Mapbox;
