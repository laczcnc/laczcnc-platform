const UNIT_OPTIONS = [
  "unidad",
  "plancha",
  "metro",
  "metro cuadrado",
  "kilogramo",
  "litro",
  "rollo",
  "caja",
  "paquete",
];

function FieldLabel({ children }) {
  return (
    <span className="mb-2 block text-sm font-semibold text-zinc-300">
      {children}
    </span>
  );
}

const inputClassName =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-teal-500";

export default function InventoryMaterialForm({
  action,
  material = null,
  includeInitialStock = false,
  submitLabel = "Guardar material",
}) {
  return (
    <form
      action={action}
      className="mt-6 grid gap-5"
    >
      {material?.id ? (
        <input
          type="hidden"
          name="material_id"
          value={material.id}
        />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <FieldLabel>
            Código / SKU *
          </FieldLabel>

          <input
            name="sku"
            type="text"
            required
            maxLength={60}
            defaultValue={material?.sku || ""}
            placeholder="MDF-03MM"
            className={inputClassName}
          />
        </label>

        <label>
          <FieldLabel>
            Nombre del material *
          </FieldLabel>

          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={180}
            defaultValue={material?.name || ""}
            placeholder="MDF crudo de 3 mm"
            className={inputClassName}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          <FieldLabel>Categoría</FieldLabel>

          <input
            name="category"
            type="text"
            maxLength={100}
            defaultValue={
              material?.category || ""
            }
            placeholder="Maderas"
            className={inputClassName}
          />
        </label>

        <label>
          <FieldLabel>
            Unidad de medida *
          </FieldLabel>

          <select
            name="unit"
            required
            defaultValue={
              material?.unit || "unidad"
            }
            className={inputClassName}
          >
            {UNIT_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        {includeInitialStock ? (
          <label>
            <FieldLabel>
              Existencia inicial
            </FieldLabel>

            <input
              name="initial_stock"
              type="number"
              min="0"
              step="0.001"
              defaultValue="0"
              className={inputClassName}
            />
          </label>
        ) : null}

        <label>
          <FieldLabel>
            Stock mínimo
          </FieldLabel>

          <input
            name="minimum_stock"
            type="number"
            min="0"
            step="0.001"
            defaultValue={
              material?.minimum_stock ?? 0
            }
            className={inputClassName}
          />
        </label>

        <label>
          <FieldLabel>
            Costo unitario (S/)
          </FieldLabel>

          <input
            name="unit_cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={
              material?.unit_cost ?? ""
            }
            placeholder="0.00"
            className={inputClassName}
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label>
          <FieldLabel>Proveedor</FieldLabel>

          <input
            name="supplier_name"
            type="text"
            maxLength={180}
            defaultValue={
              material?.supplier_name || ""
            }
            placeholder="Nombre del proveedor"
            className={inputClassName}
          />
        </label>

        <label>
          <FieldLabel>
            Teléfono del proveedor
          </FieldLabel>

          <input
            name="supplier_phone"
            type="tel"
            maxLength={40}
            defaultValue={
              material?.supplier_phone || ""
            }
            placeholder="999 999 999"
            className={inputClassName}
          />
        </label>

        <label>
          <FieldLabel>
            Ubicación física
          </FieldLabel>

          <input
            name="location"
            type="text"
            maxLength={160}
            defaultValue={
              material?.location || ""
            }
            placeholder="Estante A-02"
            className={inputClassName}
          />
        </label>
      </div>

      <label>
        <FieldLabel>Notas</FieldLabel>

        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={material?.notes || ""}
          placeholder="Presentación, características o indicaciones de compra."
          className={inputClassName}
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-teal-300 sm:w-auto"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
