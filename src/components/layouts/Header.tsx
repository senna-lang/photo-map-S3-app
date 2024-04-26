import Link from 'next/link';
import React from 'react';
import { Button } from '../ui/button';
import AuthButtonServer from '../elements/AuthButtonServer';
import FormModal from '../elements/FormModal';
import ToggleShowPinnedMarkerButton from '../elements/ToggleShowPinnedMarkerButton';

const Header = () => {
  return (
    <div className="flex py-4 px-6 border-b border-gray-300">
      <Link href={'/'}>
        <Button variant="ghost">EarthBum</Button>
      </Link>
      <div className=" ml-4">
        <FormModal />
      </div>
      <div className=" ml-4">
        <ToggleShowPinnedMarkerButton />
      </div>
      <div className=" ml-auto">
        <AuthButtonServer />
      </div>
    </div>
  );
};

export default Header;
