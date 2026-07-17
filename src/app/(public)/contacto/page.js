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
    (settings || []).map(
      (setting) => [
        setting.setting_key,
        setting.setting_value || "",
      ]
    )
  );
}

function normalizeWhatsAppPhone(phone) {
  const digits = String(
    phone || ""
  ).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("51")) {
    return digits;
  }

  if (digits.length === 9) {
    return `51${digits}`;
  }

  return digits;
}

export default async function ContactPage({
  searchParams,
}) {
  const queryParams = await searchParams;

  const initialProduct =
    typeof queryParams?.producto ===
    "string"
      ? queryParams.producto
      : "";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_settings")
    .select(`
      setting_key,
      setting_value
    `)
    .eq("is_public", true);

  if (error) {
    console.error(
      "Error cargando contacto:",
      error
    );
  }

  const settings =
    normalizeSettings(data);

  const whatsappPhone =
    normalizeWhatsAppPhone(
      settings.whatsapp_number
    );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
          Contacto
        </p>

        <h1 className="mt-3 text-4xl font-black text-zinc-50 sm:text-5xl">
          Cuéntanos qué necesitas
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-zinc-500">
          {settings.business_description ||
            "Impresión, corte láser, sublimación, publicidad y merchandising."}
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="text-xl font-black text-zinc-100">
              Información
            </h2>

            <div className="mt-6 grid gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Ubicación
                </p>

                <p className="mt-2 font-bold text-zinc-300">
                  {settings.business_address ||
                    settings.business_city ||
                    "Juliaca, Puno"}
                </p>

                {settings.business_reference ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {
                      settings.business_reference
                    }
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  WhatsApp
                </p>

                {whatsappPhone ? (
                  <a
                    href={`https://wa.me/${whatsappPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-black text-emerald-300 hover:text-emerald-200"
                  >
                    {settings.whatsapp_number}
                  </a>
                ) : (
                  <p className="mt-2 text-zinc-500">
                    Próximamente
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Correo
                </p>

                {settings.contact_email ? (
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="mt-2 inline-block font-bold text-orange-300"
                  >
                    {settings.contact_email}
                  </a>
                ) : (
                  <p className="mt-2 text-zinc-500">
                    Próximamente
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Horario
                </p>

                <p className="mt-2 whitespace-pre-line text-zinc-300">
                  {settings.business_hours ||
                    "Lunes a sábado"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                {
                  label: "Facebook",
                  url: settings.facebook_url,
                },
                {
                  label: "Instagram",
                  url: settings.instagram_url,
                },
                {
                  label: "TikTok",
                  url: settings.tiktok_url,
                },
              ]
                .filter(
                  (social) =>
                    social.url
                )
                .map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-300 transition hover:border-orange-500 hover:text-orange-400"
                  >
                    {social.label}
                  </a>
                ))}
            </div>
          </section>

          <ContactWhatsAppForm
            whatsappNumber={
              settings.whatsapp_number
            }
            initialProduct={
              initialProduct
            }
            welcomeMessage={
              settings.quote_welcome_message
            }
          />
        </div>
      </section>
    </main>
  );
}