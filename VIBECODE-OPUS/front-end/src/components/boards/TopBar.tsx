"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, LogOut, Search, SquareKanban } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { SOLID } from "@/lib/colors";
import type { SearchResults } from "@/lib/types";

const SEARCH_DEBOUNCE = 250;

function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const timer = window.setTimeout(() => {
      api
        .get<SearchResults>("/search", { params: { q: term } })
        .then(({ data }) => setResults(data))
        .catch(() => setResults({ boards: [], cards: [] }));
    }, SEARCH_DEBOUNCE);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const empty = results && results.boards.length === 0 && results.cards.length === 0;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="flex h-11 w-[325px] items-center gap-3 rounded-lg border border-border bg-surface-alt px-4 focus-within:border-navy">
        <Search size={14} className="text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
          placeholder="Buscar quadros e cards"
          className="w-full bg-transparent text-[15px] text-ink outline-none"
          aria-label="Buscar quadros e cards"
        />
      </div>
      {open && results && (
        <div className="absolute right-0 top-[52px] z-40 w-[380px] overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {empty && (
            <p className="px-4 py-5 text-[14px] text-muted">
              Nada encontrado para “{query.trim()}”.
            </p>
          )}
          {results.boards.length > 0 && (
            <div className="py-2">
              <p className="px-4 pb-1 font-mono text-[11px] uppercase tracking-wider text-placeholder">
                Quadros
              </p>
              {results.boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[14.5px] text-ink hover:bg-surface-alt"
                >
                  <LayoutGrid size={15} style={{ color: SOLID[board.color] }} />
                  {board.title}
                </Link>
              ))}
            </div>
          )}
          {results.cards.length > 0 && (
            <div className="border-t border-border py-2">
              <p className="px-4 pb-1 font-mono text-[11px] uppercase tracking-wider text-placeholder">
                Cards
              </p>
              {results.cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/boards/${card.boardId}?card=${card.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-2 hover:bg-surface-alt"
                >
                  <SquareKanban size={15} className="mt-0.5 shrink-0 text-muted" />
                  <span>
                    <span className="block text-[14.5px] text-ink">{card.title}</span>
                    <span className="block text-[12.5px] text-muted">
                      {card.boardTitle} · {card.listTitle}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-surface-alt"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar user={user} size={compact ? 32 : 38} />
        {!compact && <span className="text-[16px] text-ink">{user.name}</span>}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-[14.5px] font-medium text-ink">{user.name}</p>
            <p className="text-[13px] text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-[14.5px] text-red-dark hover:bg-red-bg"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  return (
    <header className="flex h-[78px] items-center justify-between border-b border-border bg-surface px-6 sm:px-10">
      <Logo />
      <div className="flex items-center gap-4">
        <SearchBox />
        <UserMenu />
      </div>
    </header>
  );
}
