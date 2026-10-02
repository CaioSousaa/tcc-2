"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";

function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get<SearchResult>("/search", { params: { q: term } })
        .then(({ data }) => setResults(data))
        .catch(() => setResults({ boards: [], cards: [] }));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults = results && (results.boards.length > 0 || results.cards.length > 0);

  return (
    <div ref={containerRef} className="relative hidden w-[325px] md:block">
      <div className="flex h-11 items-center gap-3 rounded-lg border border-border bg-surface-alt px-4 focus-within:border-navy">
        <Search className="size-3.5 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar quadros e cards"
          className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-placeholder"
        />
      </div>
      {open && results && (
        <div className="absolute right-0 top-[52px] z-40 w-[380px] overflow-hidden rounded-xl border border-border bg-surface py-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          {!hasResults && <p className="px-4 py-3 text-sm text-muted">Nada encontrado.</p>}
          {results.boards.length > 0 && (
            <div className="pb-1">
              <p className="px-4 py-1.5 font-mono text-[11px] uppercase tracking-[1.4px] text-muted">Quadros</p>
              {results.boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[15px] text-ink hover:bg-surface-alt"
                >
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: board.color }} />
                  {board.title}
                </Link>
              ))}
            </div>
          )}
          {results.cards.length > 0 && (
            <div>
              <p className="px-4 py-1.5 font-mono text-[11px] uppercase tracking-[1.4px] text-muted">Cards</p>
              {results.cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/boards/${card.boardId}#card-${card.id}`}
                  onClick={() => setOpen(false)}
                  className="flex flex-col px-4 py-2 hover:bg-surface-alt"
                >
                  <span className="text-[15px] text-ink">{card.title}</span>
                  <span className="text-[13px] text-muted">
                    {card.boardTitle} · {card.listTitle}
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

export function TopBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-[78px] shrink-0 items-center justify-between border-b border-border bg-surface px-6 lg:px-10">
      <Logo />
      <div className="flex items-center gap-[17px]">
        <SearchBox />
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-alt"
            >
              <Avatar user={user} size={38} />
              <span className="hidden text-base text-ink sm:inline">{user.name}</span>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-[52px] z-40 w-60 rounded-xl border border-border bg-surface p-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                  <div className="px-3 py-2">
                    <p className="text-[15px] font-medium text-ink">{user.name}</p>
                    <p className="truncate text-[13px] text-muted">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] text-red-dark hover:bg-red-bg"
                  >
                    <LogOut className="size-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
