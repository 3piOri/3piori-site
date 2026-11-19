import AdminPanel from '@/components/AdminPanel';

export const metadata = {
  title: 'Administración | 3π Ori',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <main className="admin-shell"><section className="admin-login"><span className="admin-eyebrow">CONFIGURACIÓN PENDIENTE</span><h1>Administración</h1><p>Configura las variables públicas de Supabase en el entorno de despliegue para habilitar el panel.</p><a className="admin-back" href="/">← Volver al sitio</a></section></main>;
  }
  return <AdminPanel />;
}
