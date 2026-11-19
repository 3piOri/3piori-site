import Site from '@/components/Site';
import { getSets, getSiteSettings } from '@/lib/sets';
export const revalidate = 60;
export default async function Home() {
  const [sets, settings] = await Promise.all([getSets(), getSiteSettings()]);
  return <Site sets={sets} settings={settings} />;
}
