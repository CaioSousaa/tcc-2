"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { Board } from "@/lib/types";
import api from "@/lib/api";

export default function BoardsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [boards, setBoards] = useState<Board[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadBoards();
  }, [user, router]);

  const loadBoards = async () => {
    try {
      const res = await api.get("/boards");
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/boards", { name });
      setBoards([...boards, res.data]);
      setName("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Boards</h1>
          <button
            onClick={() => useAuthStore().logout()}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Logout
          </button>
        </div>

        <form onSubmit={createBoard} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board name"
              className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Board"}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => router.push(`/boards/${board.id}`)}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition"
            >
              <h3 className="font-semibold text-lg text-gray-900">{board.name}</h3>
              <p className="text-sm text-gray-500 mt-2">
                {board.lists?.length || 0} lists
              </p>
            </div>
          ))}
        </div>

        {boards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No boards yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
