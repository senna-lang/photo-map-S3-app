'use client';

import { Album } from '@/common/types/types';
import { useState } from 'react';
import { Popup, Marker } from 'react-map-gl';
import StandardImageList from '../layouts/ImageList';
import { Button } from '../ui/button';
import { deleteAlbum } from '@/common/lib/supabase';
import { supabaseClient } from '@/common/lib/supabaseClient';

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
          maxWidth="auto"
          closeOnClick={false}
          longitude={data.coordinate!.lng}
          latitude={data.coordinate!.lat}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
        >
          <div className=" h-auto w-auto">
            <h1>{data.created_at}</h1>
            <StandardImageList images={data.image_url} />
            <Button onClick={() => deleteAlbum(supabaseClient, data.id)}>
              DELETE
            </Button>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default GeoMarker;
