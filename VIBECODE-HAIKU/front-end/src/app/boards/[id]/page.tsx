"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { Board, List, Card as CardType } from "@/lib/types";
import api from "@/lib/api";

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  const { user } = useAuthStore();
  const [board, setBoard] = useState<Board | null>(null);
  const [listName, setListName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadBoard();
  }, [user, router]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/boards/${boardId}`);
      setBoard(res.data);
    } catch (err) {
      console.error(err);
      router.push("/boards");
    } finally {
      setLoading(false);
    }
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;
    try {
      await api.post("/lists", { boardId, name: listName });
      setListName("");
      loadBoard();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm("Delete this list and all its cards?")) return;
    try {
      await api.delete(`/lists/${listId}`);
      loadBoard();
    } catch (err) {
      console.error(err);
    }
  };

  const createCard = async (listId: string, title: string) => {
    if (!title.trim()) return;
    try {
      await api.post("/cards", { listId, title });
      loadBoard();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      await api.delete(`/cards/${cardId}`);
      loadBoard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!board) return <div className="p-8">Board not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/boards")}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Boards
        </button>
        <h1 className="text-3xl font-bold">{board.name}</h1>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.lists?.map((list: List) => (
          <div key={list.id} className="bg-gray-200 rounded-lg p-4 w-80 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">{list.name}</h3>
              <button
                onClick={() => deleteList(list.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {list.cards?.map((card: CardType) => (
                <div
                  key={card.id}
                  className="bg-white p-3 rounded shadow hover:shadow-md cursor-pointer group"
                  onClick={() =>
                    router.push(`/boards/${boardId}/cards/${card.id}`)
                  }
                >
                  <div className="flex justify-between">
                    <span className="text-sm">{card.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(card.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-xs opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                  {card.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(card.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <CardCreator
              listId={list.id}
              onCreate={(title) => createCard(list.id, title)}
            />
          </div>
        ))}

        <div className="bg-gray-200 rounded-lg p-4 w-80 flex-shrink-0 h-fit">
          <form onSubmit={createList}>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="List name"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              required
            />
            <button
              type="submit"
              className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Add List
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CardCreator({
  listId,
  onCreate,
}: {
  listId: string;
  onCreate: (title: string) => void;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCreate(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add card..."
        className="flex-1 px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
      >
        Add
      </button>
    </form>
  );
}
