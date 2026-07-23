"use client";

import { useRef } from "react";

export default function InlineActionMenu({
  action,
  currentValue,
  currentLabel,
  currentClassName = "",
  fieldName,
  options = [],
  hiddenFields = {},
  confirmMessage = "",
  disabled = false,
}) {
  const detailsRef = useRef(null);

  function confirmChange(event, label) {
    if (
      confirmMessage &&
      !window.confirm(
        confirmMessage.replace("{value}", label)
      )
    ) {
      event.preventDefault();
      return;
    }
    detailsRef.current?.removeAttribute("open");
  }

  if (disabled) {
    return (
      <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-[11px] font-black uppercase tracking-wide ${currentClassName}`}>
        {currentLabel}
      </span>
    );
  }

  return (
    <details ref={detailsRef} className="relative z-20">
      <summary title="Toca para cambiar" className={`inline-flex min-h-8 cursor-pointer list-none items-center rounded-full border px-3 text-[11px] font-black uppercase tracking-wide ${currentClassName}`}>
        {currentLabel}
        <span className="ml-1.5 text-[9px] opacity-70">▾</span>
      </summary>

      <div className="absolute left-0 top-[calc(100%+6px)] z-50 grid min-w-44 gap-1 rounded-xl border border-zinc-700 bg-zinc-950 p-1.5 shadow-2xl">
        {options
          .filter((option) => option.value !== currentValue)
          .map((option) => (
            <form
              key={option.value}
              action={action}
              onSubmit={(event) =>
                confirmChange(event, option.label)
              }
            >
              {Object.entries(hiddenFields).map(
                ([name, value]) => (
                  <input
                    key={name}
                    type="hidden"
                    name={name}
                    value={value ?? ""}
                  />
                )
              )}
              <button
                type="submit"
                name={fieldName}
                value={option.value}
                className="flex min-h-9 w-full items-center rounded-lg px-3 text-left text-xs font-bold text-zinc-200 hover:bg-zinc-800"
              >
                {option.label}
              </button>
            </form>
          ))}
      </div>
    </details>
  );
}
