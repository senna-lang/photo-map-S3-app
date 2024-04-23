import ImageForm from '@/components/Form';
import Mapbox from '@/components/features/Map';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ImageForm />
      <Mapbox/>
    </main>
  );
}
