"use client";

import { useParams } from "next/navigation";
import { BoardView } from "@/components/kanban/BoardView";
import { RequireAuth } from "@/components/RequireAuth";

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  return (
    <RequireAuth>
      <BoardView boardId={boardId} />
    </RequireAuth>
  );
}
