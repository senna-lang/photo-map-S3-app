'use client'

import Map from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const Mapbox = () => {
  return (
    <Map
      id='map'
      initialViewState={{
        longitude: 137.760725,
        latitude: 38.152981,
        zoom: 5
      }}
      style={{ width: '100%', height: '100vh' }}
      mapStyle='mapbox://styles/senna-lang/clvaj709a00p901q13orl1h14'
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAP_BOX_ACCESS_KEY}
    />
  )
}

export default Mapbox