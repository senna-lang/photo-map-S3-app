'use client';

import { Album } from '@/common/types/types';
import { useState } from 'react';
import Image from 'next/image';
import { Popup, Marker } from 'react-map-gl';
import StandardImageList from '../layouts/ImageList';

const GeoMarker = ({ data }: { data: Album }) => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  return (
    <div>
      <Marker
        longitude={data.coordinate!.lng}
        latitude={data.coordinate!.lat}
        anchor="bottom"
        onClick={() => setShowPopup(true)}
      />
      {showPopup && (
        <Popup
          offset={25}
          maxWidth='auto'
          closeOnClick={false}
          longitude={data.coordinate!.lng}
          latitude={data.coordinate!.lat}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
        >
          <div className=" h-auto w-auto">
            <h1>{data.created_at}</h1>
            {/* <Image
              height={3000}
              width={3000}
              src={data.image_url!}
              alt={data.created_at}
            /> */}
            <StandardImageList images={data.image_url}/>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default GeoMarker;
