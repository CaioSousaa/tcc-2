"use client";

import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BoardView } from "@/components/board/BoardView";

export default function BoardPage() {
  const params = useParams<{ boardId: string }>();
  return (
    <RequireAuth>
      <BoardView key={params.boardId} boardId={params.boardId} />
    </RequireAuth>
  );
}
