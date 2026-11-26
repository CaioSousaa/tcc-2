"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { Card as CardType, Comment, Checklist as ChecklistType } from "@/lib/types";
import api from "@/lib/api";

export default function CardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  const cardId = params.cardId as string;
  const { user } = useAuthStore();
  const [card, setCard] = useState<CardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [commentText, setCommentText] = useState("");
  const [checklistName, setChecklistName] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadCard();
  }, [user, router]);

  const loadCard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/cards/${cardId}`);
      setCard(res.data);
      setTitle(res.data.title);
      setDescription(res.data.description || "");
      setDueDate(res.data.dueDate ? res.data.dueDate.split("T")[0] : "");
    } catch (err) {
      console.error(err);
      router.push(`/boards/${boardId}`);
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async () => {
    try {
      await api.put(`/cards/${cardId}`, { title, description, dueDate });
      loadCard();
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post("/comments", { cardId, content: commentText });
      setCommentText("");
      loadCard();
    } catch (err) {
      console.error(err);
    }
  };

  const createChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistName.trim()) return;
    try {
      await api.post("/checklists", { cardId, title: checklistName });
      setChecklistName("");
      loadCard();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    try {
      await api.put(`/checklists/items/${itemId}/toggle`, {});
      loadCard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!card) return <div className="p-8">Card not found</div>;

  const isOverdue =
    card.dueDate && new Date(card.dueDate) < new Date() && card.dueDate;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push(`/boards/${boardId}`)}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={updateCard}
            className="text-2xl font-bold mb-4 w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={updateCard}
            placeholder="Description"
            className="w-full px-2 py-1 border rounded mb-4 h-24 focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={updateCard}
                className="px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {isOverdue && (
                <p className="text-red-600 text-sm mt-1">Overdue!</p>
              )}
            </div>
          </div>

          {card.cardLabels && card.cardLabels.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Labels</h3>
              <div className="flex gap-2 flex-wrap">
                {card.cardLabels.map((cl) => (
                  <span
                    key={cl.id}
                    className="px-3 py-1 rounded text-sm text-white"
                    style={{ backgroundColor: cl.label?.color }}
                  >
                    {cl.label?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.checklists && card.checklists.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Checklists</h3>
              {card.checklists.map((checklist: ChecklistType) => (
                <div key={checklist.id} className="mb-4">
                  <p className="font-medium text-sm">{checklist.title}</p>
                  <div className="space-y-2 mt-2">
                    {checklist.items?.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(item.id)}
                          className="w-4 h-4"
                        />
                        <span
                          className={
                            item.completed
                              ? "line-through text-gray-500"
                              : ""
                          }
                        >
                          {item.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Add Checklist</h3>
            <form onSubmit={createChecklist} className="flex gap-2">
              <input
                type="text"
                value={checklistName}
                onChange={(e) => setChecklistName(e.target.value)}
                placeholder="Checklist name"
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </form>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Comments</h3>

            {card.comments && card.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {card.comments.map((comment: Comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded">
                    <p className="font-medium text-sm">{comment.user?.name}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={addComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add comment..."
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
