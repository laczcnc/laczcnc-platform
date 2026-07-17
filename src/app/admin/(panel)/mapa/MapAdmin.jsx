"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import L from "leaflet";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import {
  changeMapLocationStatus,
  createMapLocation,
  toggleMapLocation,
  updateMapLocation,
} from "./actions";

const STATUS_LABELS = {
  pending: "Pendiente",
  visited: "Visitado",
  interested: "Interesado",
  not_interested: "No interesado",
  reschedule: "Reagendar",
};

const TYPE_LABELS = {
  prospect: "Prospecto",
  customer: "Cliente",
  institution: "Institución",
  company: "Empresa",
  business: "Comercio",
  event: "Evento",
  workshop: "Taller",
  other: "Otro",
};

const STATUS_COLORS = {
  pending: "#f59e0b",
  visited: "#3b82f6",
  interested: "#10b981",
  not_interested: "#ef4444",
  reschedule: "#a855f7",
};

function formatDate(value) {
  if (!value) {
    return "Sin programar";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
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

function createMarkerIcon(status) {
  const color =
    STATUS_COLORS[status] ||
    STATUS_COLORS.pending;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:28px;
        height:28px;
        border-radius:50% 50% 50% 0;
        background:${color};
        border:3px solid #ffffff;
        box-shadow:0 4px 12px rgba(0,0,0,.55);
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <div style="
          width:8px;
          height:8px;
          border-radius:50%;
          background:#18181b;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function LongPressCreator({
  onLongPress,
}) {
  const timerRef = useRef(null);
  const positionRef = useRef(null);

  function cancelTimer() {
    if (timerRef.current) {
      window.clearTimeout(
        timerRef.current
      );

      timerRef.current = null;
    }
  }

  useMapEvents({
    mousedown(event) {
      cancelTimer();

      positionRef.current =
        event.latlng;

      timerRef.current =
        window.setTimeout(() => {
          if (positionRef.current) {
            onLongPress(
              positionRef.current
            );
          }

          timerRef.current = null;
        }, 3000);
    },

    mouseup() {
      cancelTimer();
    },

    mouseout() {
      cancelTimer();
    },

    dragstart() {
      cancelTimer();
    },

    zoomstart() {
      cancelTimer();
    },

    contextmenu(event) {
      event.originalEvent.preventDefault();

      onLongPress(event.latlng);
    },
  });

  useEffect(() => {
    return () => {
      cancelTimer();
    };
  }, []);

  return null;
}

export default function MapAdmin({
  locations,
  profiles,
}) {
  const [pendingPosition, setPendingPosition] =
    useState(null);

  const [selectedStatus, setSelectedStatus] =
    useState("all");

  const [selectedType, setSelectedType] =
    useState("all");

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesStatus =
        selectedStatus === "all" ||
        location.status === selectedStatus;

      const matchesType =
        selectedType === "all" ||
        location.location_type ===
          selectedType;

      return matchesStatus && matchesType;
    });
  }, [
    locations,
    selectedStatus,
    selectedType,
  ]);

  async function handleCreateLocation(
    formData
  ) {
    await createMapLocation(formData);

    setPendingPosition(null);
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">
            Estado
          </label>

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          >
            <option value="all">
              Todos los estados
            </option>

            {Object.entries(
              STATUS_LABELS
            ).map(([status, label]) => (
              <option
                key={status}
                value={status}
              >
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">
            Tipo
          </label>

          <select
            value={selectedType}
            onChange={(event) =>
              setSelectedType(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          >
            <option value="all">
              Todos los tipos
            </option>

            {Object.entries(
              TYPE_LABELS
            ).map(([type, label]) => (
              <option
                key={type}
                value={type}
              >
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-900 px-5 py-4">
          <p className="font-black text-zinc-200">
            Mantén presionado tres segundos para
            crear un marcador
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            En computadora también puedes usar
            clic derecho.
          </p>
        </div>

        <MapContainer
          center={[-15.5, -70.132]}
          zoom={13}
          scrollWheelZoom
          className="h-[620px] w-full"
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LongPressCreator
            onLongPress={
              setPendingPosition
            }
          />

          {filteredLocations.map(
            (location) => {
              const whatsappPhone =
                normalizeWhatsAppPhone(
                  location.phone
                );

              return (
                <Marker
                  key={location.id}
                  position={[
                    Number(
                      location.latitude
                    ),
                    Number(
                      location.longitude
                    ),
                  ]}
                  icon={createMarkerIcon(
                    location.status
                  )}
                >
                  <Popup minWidth={320}>
                    <div className="text-zinc-900">
                      <p className="text-xs font-bold uppercase text-zinc-500">
                        {
                          TYPE_LABELS[
                            location
                              .location_type
                          ]
                        }
                      </p>

                      <h3 className="mt-1 text-lg font-black">
                        {location.name}
                      </h3>

                      <p className="mt-1 text-sm">
                        {
                          STATUS_LABELS[
                            location.status
                          ]
                        }
                      </p>

                      {location.organization_name ? (
                        <p className="mt-2 text-sm font-bold">
                          {
                            location.organization_name
                          }
                        </p>
                      ) : null}

                      <p className="mt-2 text-xs text-zinc-600">
                        Próxima visita:{" "}
                        {formatDate(
                          location.next_visit_at
                        )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {whatsappPhone ? (
                          <a
                            href={`https://wa.me/${whatsappPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer font-bold">
                          Registrar visita
                        </summary>

                        <form
                          action={
                            changeMapLocationStatus
                          }
                          className="mt-3 grid gap-2"
                        >
                          <input
                            type="hidden"
                            name="location_id"
                            value={location.id}
                          />

                          <input
                            type="hidden"
                            name="current_status"
                            value={
                              location.status
                            }
                          />

                          <select
                            name="new_status"
                            defaultValue={
                              location.status
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            {Object.entries(
                              STATUS_LABELS
                            ).map(
                              ([
                                status,
                                label,
                              ]) => (
                                <option
                                  key={
                                    status
                                  }
                                  value={
                                    status
                                  }
                                >
                                  {label}
                                </option>
                              )
                            )}
                          </select>

                          <input
                            name="next_visit_at"
                            type="datetime-local"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <textarea
                            name="visit_notes"
                            rows={2}
                            placeholder="Resultado de la visita"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <button className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold text-white">
                            Guardar visita
                          </button>
                        </form>
                      </details>

                      <details className="mt-3">
                        <summary className="cursor-pointer font-bold">
                          Editar marcador
                        </summary>

                        <form
                          action={
                            updateMapLocation
                          }
                          className="mt-3 grid gap-2"
                        >
                          <input
                            type="hidden"
                            name="location_id"
                            value={location.id}
                          />

                          <input
                            name="name"
                            required
                            defaultValue={
                              location.name
                            }
                            placeholder="Nombre"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <input
                            name="contact_name"
                            defaultValue={
                              location.contact_name ||
                              ""
                            }
                            placeholder="Contacto"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <input
                            name="phone"
                            defaultValue={
                              location.phone ||
                              ""
                            }
                            placeholder="Teléfono"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <input
                            name="organization_name"
                            defaultValue={
                              location.organization_name ||
                              ""
                            }
                            placeholder="Organización"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <select
                            name="location_type"
                            defaultValue={
                              location.location_type
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            {Object.entries(
                              TYPE_LABELS
                            ).map(
                              ([
                                type,
                                label,
                              ]) => (
                                <option
                                  key={type}
                                  value={type}
                                >
                                  {label}
                                </option>
                              )
                            )}
                          </select>

                          <select
                            name="status"
                            defaultValue={
                              location.status
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            {Object.entries(
                              STATUS_LABELS
                            ).map(
                              ([
                                status,
                                label,
                              ]) => (
                                <option
                                  key={
                                    status
                                  }
                                  value={
                                    status
                                  }
                                >
                                  {label}
                                </option>
                              )
                            )}
                          </select>

                          <input
                            name="city"
                            defaultValue={
                              location.city ||
                              ""
                            }
                            placeholder="Ciudad"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <input
                            name="district"
                            defaultValue={
                              location.district ||
                              ""
                            }
                            placeholder="Distrito"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <input
                            name="address"
                            defaultValue={
                              location.address ||
                              ""
                            }
                            placeholder="Dirección"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <input
                            name="reference"
                            defaultValue={
                              location.reference ||
                              ""
                            }
                            placeholder="Referencia"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <select
                            name="assigned_to"
                            defaultValue={
                              location.assigned_to ||
                              ""
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            <option value="">
                              Sin responsable
                            </option>

                            {profiles.map(
                              (profile) => (
                                <option
                                  key={
                                    profile.id
                                  }
                                  value={
                                    profile.id
                                  }
                                >
                                  {
                                    profile.full_name
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <input
                            name="next_visit_at"
                            type="datetime-local"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <textarea
                            name="notes"
                            rows={2}
                            defaultValue={
                              location.notes ||
                              ""
                            }
                            placeholder="Notas"
                            className="rounded-lg border px-3 py-2 text-sm"
                          />

                          <button className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold text-white">
                            Guardar cambios
                          </button>
                        </form>
                      </details>

                      <form
                        action={
                          toggleMapLocation
                        }
                        className="mt-3"
                      >
                        <input
                          type="hidden"
                          name="location_id"
                          value={location.id}
                        />

                        <input
                          type="hidden"
                          name="current_status"
                          value="true"
                        />

                        <button className="text-xs font-bold text-red-600">
                          Ocultar marcador
                        </button>
                      </form>
                    </div>
                  </Popup>
                </Marker>
              );
            }
          )}
        </MapContainer>
      </section>

      {pendingPosition ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Nuevo marcador
                </p>

                <h2 className="mt-2 text-2xl font-black text-zinc-100">
                  Registrar ubicación
                </h2>

                <p className="mt-2 font-mono text-xs text-zinc-600">
                  {pendingPosition.lat.toFixed(
                    7
                  )}
                  ,{" "}
                  {pendingPosition.lng.toFixed(
                    7
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPendingPosition(null)
                }
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-400"
              >
                Cerrar
              </button>
            </div>

            <form
              action={handleCreateLocation}
              className="mt-6 grid gap-4"
            >
              <input
                type="hidden"
                name="latitude"
                value={pendingPosition.lat}
              />

              <input
                type="hidden"
                name="longitude"
                value={pendingPosition.lng}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={160}
                  placeholder="Nombre del prospecto o lugar"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
                />

                <select
                  name="location_type"
                  defaultValue="prospect"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
                >
                  {Object.entries(
                    TYPE_LABELS
                  ).map(([type, label]) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="contact_name"
                  placeholder="Persona de contacto"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
                />

                <input
                  name="phone"
                  type="tel"
                  placeholder="Teléfono o WhatsApp"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
                />
              </div>

              <input
                name="organization_name"
                placeholder="Empresa o institución"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="city"
                  defaultValue="Juliaca"
                  placeholder="Ciudad"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
                />

                <input
                  name="district"
                  placeholder="Distrito"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
                />
              </div>

              <input
                name="address"
                placeholder="Dirección"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <input
                name="reference"
                placeholder="Referencia"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <select
                name="assigned_to"
                defaultValue=""
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              >
                <option value="">
                  Sin responsable
                </option>

                {profiles.map((profile) => (
                  <option
                    key={profile.id}
                    value={profile.id}
                  >
                    {profile.full_name}
                  </option>
                ))}
              </select>

              <input
                name="next_visit_at"
                type="datetime-local"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <textarea
                name="notes"
                rows={3}
                placeholder="Notas u oportunidad comercial"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <button className="rounded-xl bg-orange-500 px-5 py-3 font-black text-zinc-950">
                Crear marcador
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}