export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>LaczCnC Platform</h1>

      <p>
        URL:
        {process.env.NEXT_PUBLIC_SUPABASE_URL
          ? " ✅ Detectada"
          : " ❌ No encontrada"}
      </p>

      <p>
        KEY:
        {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? " ✅ Detectada"
          : " ❌ No encontrada"}
      </p>
    </main>
  );
}