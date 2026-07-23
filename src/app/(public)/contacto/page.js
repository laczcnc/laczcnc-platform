import ContactWhatsAppForm from "@/modules/contact/components/ContactWhatsAppForm";
import { createClient } from "@/infrastructure/supabase/server";

export const metadata = {
  title: "Contacto",
  description:
    "Contacta con LaczCnC para solicitar productos personalizados, publicidad, impresión y merchandising.",
};

export const dynamic = "force-dynamic";

function normalizeSettings(settings) {
  return Object.fromEntries(
    (settings || []).map((setting) => [
      setting.setting_key,
      setting.setting_value || "",
    ])
  );
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("51")) {
    return digits;
  }

  return digits.length === 9 ? `51${digits}` : digits;
}

export default async function ContactPage({ searchParams }) {
  const queryParams = await searchParams;
  const initialProduct =
    typeof queryParams?.producto === "string"
      ? queryParams.producto
      : "";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select("setting_key, setting_value")
    .eq("is_public", true);

  if (error) {
    console.error("Error cargando contacto:", error);
  }

  const settings = normalizeSettings(data);
  const whatsappPhone = normalizePhone(settings.whatsapp_number);
  const callPhone = normalizePhone(settings.contact_phone);
  const location =
    settings.business_address ||
    settings.business_city ||
    "Juliaca, Puno, Perú";

  const socialLinks = [
    { label: "Facebook", url: settings.facebook_url },
    { label: "Instagram", url: settings.instagram_url },
    { label: "TikTok", url: settings.tiktok_url },
    { label: "YouTube", url: settings.youtube_url },
  ].filter((social) => social.url);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
          {settings.business_name || "LaczCnC"} · Contacto
        </p>

        <h1 className="mt-3 text-3xl font-black text-zinc-50 sm:text-4xl">
          {settings.contact_heading || "Cuéntanos qué necesitas"}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
          {settings.contact_intro ||
            settings.business_description ||
            "Impresión, corte láser, sublimación, publicidad y merchandising."}
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-black text-zinc-100">
              Información
            </h2>

            <div className="mt-5 divide-y divide-zinc-800">
              <div className="pb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Ubicación
                </p>
                <p className="mt-1.5 text-sm font-bold text-zinc-300">
                  {location}
                </p>
                {settings.business_city &&
                settings.business_address ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {settings.business_city}
                  </p>
                ) : null}
                {settings.business_reference ? (
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">
                    {settings.business_reference}
                  </p>
                ) : null}
                {settings.google_maps_url ? (
                  <a
                    href={settings.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950"
                  >
                    Abrir en Google Maps
                  </a>
                ) : null}
              </div>

              <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    WhatsApp
                  </p>
                  {whatsappPhone ? (
                    <a
                      href={`https://wa.me/${whatsappPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-block text-sm font-black text-emerald-300"
                    >
                      {settings.whatsapp_number}
                    </a>
                  ) : (
                    <p className="mt-1.5 text-sm text-zinc-600">
                      Por configurar
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Teléfono
                  </p>
                  {callPhone ? (
                    <a
                      href={`tel:+${callPhone}`}
                      className="mt-1.5 inline-block text-sm font-bold text-zinc-300"
                    >
                      {settings.contact_phone}
                    </a>
                  ) : (
                    <p className="mt-1.5 text-sm text-zinc-600">
                      Por configurar
                    </p>
                  )}
                </div>
              </div>

              <div className="py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Correo
                </p>
                {settings.contact_email ? (
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="mt-1.5 inline-block break-all text-sm font-bold text-orange-300"
                  >
                    {settings.contact_email}
                  </a>
                ) : (
                  <p className="mt-1.5 text-sm text-zinc-600">
                    Por configurar
                  </p>
                )}
              </div>

              <div className="py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Horario
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-zinc-300">
                  {settings.business_hours || "Lunes a sábado"}
                </p>
              </div>

              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-400 transition hover:border-orange-500 hover:text-orange-300"
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <ContactWhatsAppForm
            whatsappNumber={settings.whatsapp_number}
            initialProduct={initialProduct}
            welcomeMessage={settings.quote_welcome_message}
          />
        </div>
      </section>
    </main>
  );
}
