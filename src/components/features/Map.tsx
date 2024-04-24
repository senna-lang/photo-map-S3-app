'use client';

import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Marker, Popup } from 'react-map-gl';
import { useState } from 'react';
import { LngLat } from '@/common/types/types';

const Mapbox = () => {
  const [lngLat, setLngLat] = useState<LngLat>({
    lng: null,
    lat: null,
  });
  const [showPopup, setShowPopup] = useState<boolean>(true);

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
      <Marker
        longitude={lngLat.lng!}
        latitude={lngLat.lat!}
        anchor="bottom"
        onClick={() => setShowPopup(true)}
      />
      {/* {showPopup && (
        <Popup
          longitude={137.760725}
          latitude={38.152981}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
        >
          You are here
        </Popup>
      )} */}
    </Map>
  );
};

export default Mapbox;
