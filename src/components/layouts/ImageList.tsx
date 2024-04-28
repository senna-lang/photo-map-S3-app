import * as React from 'react';
import Image from 'next/image';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

export default function StandardImageList({ images }: { images: string[] }) {
  return (
    <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
      {images.map((image,index) => (
        <ImageListItem key={index}>
           <Image
              height={3000}
              width={3000}
              src={image}
              alt={image}
            />
        </ImageListItem>
      ))}
    </ImageList>
  );
}

