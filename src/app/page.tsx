import ImageForm from '@/components/Form';
import AuthButtonServer from '@/components/elements/AuthButtonServer';
import Mapbox from '@/components/features/Map';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <AuthButtonServer/>
      <ImageForm />
      <Mapbox/>
    </main>
  );
}
