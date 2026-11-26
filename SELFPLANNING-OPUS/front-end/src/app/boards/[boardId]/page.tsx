"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BoardScreen } from "@/components/board/BoardScreen";

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();

  return (
    <AuthGuard>
      <BoardScreen key={boardId} boardId={boardId} />
    </AuthGuard>
  );
}
