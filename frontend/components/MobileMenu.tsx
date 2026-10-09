"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./ui/Icons";

type Item = { label: string; href: string };

/** Disclosure menu for phones, where the inline nav is hidden. Escape closes it and returns focus. */
export function MobileMenu({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="-ml-2 flex size-11 cursor-pointer items-center justify-center rounded-full"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="absolute left-3 right-3 top-[calc(100%-4px)] z-40 rounded-[22px] border border-ink/10 bg-white p-2 shadow-[0_24px_50px_-24px_rgba(40,50,160,0.5)]"
        >
          <ul>
            {items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-2xl px-4 text-[16px] font-medium hover:bg-ink/[0.05]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
