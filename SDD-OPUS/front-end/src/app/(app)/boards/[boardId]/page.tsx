import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { BoardView } from "@/components/board/BoardView";

export default async function BoardPage({ params }: PageProps<"/boards/[boardId]">) {
  const { boardId } = await params;
  return (
    <Suspense fallback={<Spinner label="Carregando quadro…" />}>
      <BoardView boardId={boardId} />
    </Suspense>
  );
}
