"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryPresentation } from "@/config/category-presentation";

type Option = { slug: string; name: string };

/** "Any occasion" plus every category; `slug` "" means all categories. */
type Choice = { slug: string; name: string };

/**
 * "What are you planning?" picker: opens the chosen event category.
 *
 * A custom listbox instead of a native <select>, because the browser draws native option lists in its
 * own small system font. Follows the WAI-ARIA select-only combobox pattern: Up/Down/Home/End to move,
 * Enter or Space to choose, Escape to close, and typing a letter jumps to the next matching option.
 */
export function PlannerBox({ categories }: { categories: Option[] }) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const labelId = `${id}-label`;

  const featured = categories.filter((c) => categoryPresentation(c.slug).group === "featured");
  const other = categories.filter((c) => categoryPresentation(c.slug).group === "other");
  const choices: Choice[] = [{ slug: "", name: "Any occasion" }, ...featured, ...other];

  const [selected, setSelected] = useState(0);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) {
      listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active]);

  const openList = () => {
    setActive(selected);
    setOpen(true);
  };

  const buttonId = `${id}-button`;

  const choose = (index: number) => {
    setSelected(index);
    setOpen(false);
    // Return focus to the picker (looked up by id: refs must not be read from render-created handlers).
    document.getElementById(buttonId)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = choices.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(a + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const letter = e.key.toLowerCase();
          const order = [...choices.keys()].map((i) => (active + 1 + i) % choices.length);
          const match = order.find((i) => choices[i].name.toLowerCase().startsWith(letter));
          if (match !== undefined) setActive(match);
        }
    }
  };

  const optionProps = (index: number) => ({
    id: `${id}-option-${index}`,
    role: "option" as const,
    "aria-selected": index === selected,
    "data-index": index,
    onPointerMove: () => setActive(index),
    onClick: () => choose(index),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const slug = choices[selected].slug;
        router.push(slug ? `/categories/${slug}` : "/categories");
      }}
      className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-card ring-1 ring-line sm:flex-row sm:items-stretch"
    >
      <div ref={rootRef} className="relative flex flex-1 items-center gap-3 rounded-lg px-4 py-2">
        <span aria-hidden="true" className="text-xl text-terracotta">✳</span>
        <div className="flex flex-1 flex-col">
          <span id={labelId} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
            What are you planning?
          </span>
          <button
            id={buttonId}
            type="button"
            role="combobox"
            aria-labelledby={labelId}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open ? `${id}-option-${active}` : undefined}
            onClick={() => (open ? setOpen(false) : openList())}
            onKeyDown={onKeyDown}
            className="flex w-full items-center justify-between gap-3 py-1 text-left text-base font-medium text-ink outline-none focus-visible:underline focus-visible:decoration-terracotta focus-visible:underline-offset-4"
          >
            <span className="truncate">{choices[selected].name}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`size-5 shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>
        </div>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-40 max-h-[22rem] origin-top animate-scale-in overflow-y-auto rounded-xl bg-white p-2 shadow-card ring-1 ring-line sm:-left-3 sm:-right-3"
          >
            <ChoiceItem choice={choices[0]} active={active === 0} selected={selected === 0} {...optionProps(0)} />
            <GroupLabel>Main categories</GroupLabel>
            {featured.map((c, i) => {
              const index = 1 + i;
              return <ChoiceItem key={c.slug} choice={c} active={active === index} selected={selected === index} {...optionProps(index)} />;
            })}
            {other.length > 0 && <GroupLabel>Other categories</GroupLabel>}
            {other.map((c, i) => {
              const index = 1 + featured.length + i;
              return <ChoiceItem key={c.slug} choice={c} active={active === index} selected={selected === index} {...optionProps(index)} />;
            })}
          </ul>
        )}
      </div>
      <button
        type="submit"
        className="group inline-flex items-center justify-center gap-3 rounded-lg bg-plum px-6 py-4 font-semibold text-champagne-200 transition-all hover:bg-plum-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      >
        Start exploring <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">⟶</span>
      </button>
    </form>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <li role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
      {children}
    </li>
  );
}

function ChoiceItem({
  choice,
  active,
  selected,
  ...props
}: {
  choice: Choice;
  active: boolean;
  selected: boolean;
} & React.LiHTMLAttributes<HTMLLIElement> & { "data-index": number }) {
  const presentation = choice.slug ? categoryPresentation(choice.slug) : null;
  return (
    <li
      {...props}
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors ${
        active ? "bg-sand text-ink" : "text-ink"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-9 shrink-0 items-center justify-center rounded-md ${presentation ? presentation.tile.bg : "bg-champagne-200"}`}
      >
        {presentation ? (
          <CategoryIcon name={presentation.icon} className={`size-5 ${presentation.tile.icon}`} />
        ) : (
          <span className="text-terracotta">✳</span>
        )}
      </span>
      <span className="flex-1">{choice.name}</span>
      {selected && (
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5 text-terracotta">
          <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0z" />
        </svg>
      )}
    </li>
  );
}

export function PlannerBoxSkeleton() {
  return <div aria-hidden="true" className="skeleton h-[84px] rounded-xl ring-1 ring-line" />;
}
