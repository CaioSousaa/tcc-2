import { Suspense } from "react";
import { BoardView } from "@/components/board/BoardView";

export const metadata = { title: "Quadro · Quadros de Tarefas" };

export default async function Page({ params }: PageProps<"/boards/[boardId]">) {
  const { boardId } = await params;
  return (
    <Suspense>
      <BoardView boardId={boardId} />
    </Suspense>
  );
}
