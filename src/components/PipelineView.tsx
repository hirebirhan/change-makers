"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, KanbanSquare, RefreshCw } from "lucide-react";

const COLUMNS = [
  { id: "ideas",     label: "Ideas",     color: "bg-muted" },
  { id: "scripted",  label: "Scripted",  color: "bg-blue-500/10" },
  { id: "filming",   label: "Filming",   color: "bg-yellow-500/10" },
  { id: "editing",   label: "Editing",   color: "bg-orange-500/10" },
  { id: "scheduled", label: "Scheduled", color: "bg-purple-500/10" },
  { id: "published", label: "Published", color: "bg-green-500/10" },
] as const;

type ColumnId = typeof COLUMNS[number]["id"];

interface PipelineCard {
  id: string;
  title: string;
  column: ColumnId;
  createdAt: number;
}

export function PipelineView() {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitles, setNewTitles] = useState<Record<ColumnId, string>>(
    Object.fromEntries(COLUMNS.map((c) => [c.id, ""])) as Record<ColumnId, string>
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOver = useRef<ColumnId | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchCards() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline");
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setCards(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pipeline — is json-server running? (npm run db)");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCards(); }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function addCard(col: ColumnId) {
    const title = newTitles[col].trim();
    if (!title) return;
    setNewTitles((prev) => ({ ...prev, [col]: "" }));

    const card: Omit<PipelineCard, "id"> = { title, column: col, createdAt: Date.now() };
    const res = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    const created: PipelineCard = await res.json();
    setCards((prev) => [...prev, created]);
  }

  async function deleteCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
  }

  async function moveCard(id: string, to: ColumnId) {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, column: to } : c));
    await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column: to }),
    });
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  function onDragStart(id: string) { setDragging(id); }
  function onDragEnd() {
    if (dragging && dragOver.current) moveCard(dragging, dragOver.current);
    setDragging(null);
    dragOver.current = null;
  }

  const cardsInCol = (col: ColumnId) =>
    cards.filter((c) => c.column === col).sort((a, b) => a.createdAt - b.createdAt);

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <main className="flex-1 w-full px-4 md:px-6 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <KanbanSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Content Pipeline</h1>
            <p className="text-xs text-muted-foreground">Drag ideas through your production stages</p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">{cards.length} cards</Badge>
        </div>

        {/* Error / loading */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 shrink-0" onClick={fetchCards}>
              <RefreshCw className="size-3.5" />Retry
            </Button>
          </div>
        )}

        {loading && !error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <RefreshCw className="size-4 animate-spin" />Loading pipeline…
          </div>
        )}

        {/* Board */}
        {!loading && !error && (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const colCards = cardsInCol(col.id);
              return (
                <div
                  key={col.id}
                  className="flex flex-col gap-2 min-w-[200px] w-[200px] shrink-0"
                  onDragOver={(e) => { e.preventDefault(); dragOver.current = col.id; }}
                >
                  {/* Column header */}
                  <div className={`rounded-lg px-3 py-2 ${col.color}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{col.label}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{colCards.length}</Badge>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-1.5 min-h-[40px]">
                    {colCards.map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => onDragStart(card.id)}
                        onDragEnd={onDragEnd}
                        className={`group rounded-md border bg-card px-2.5 py-2 cursor-grab active:cursor-grabbing select-none transition-opacity ${
                          dragging === card.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="size-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                          <p className="text-xs flex-1 leading-snug">{card.title}</p>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add card input */}
                  <div className="flex gap-1">
                    <Input
                      placeholder="Add idea…"
                      value={newTitles[col.id]}
                      onChange={(e) => setNewTitles((prev) => ({ ...prev, [col.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addCard(col.id)}
                      className="h-7 text-xs px-2"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => addCard(col.id)}
                      disabled={!newTitles[col.id].trim()}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
