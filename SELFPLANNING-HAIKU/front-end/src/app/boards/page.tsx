'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components';
import { boardService, type Board } from '@/services/boardService';

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setIsLoading(true);
      const response = await boardService.getBoards();
      setBoards(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      await boardService.createBoard({
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || undefined,
      });
      setNewBoardTitle('');
      setNewBoardDescription('');
      setIsCreating(false);
      await loadBoards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return;

    try {
      await boardService.deleteBoard(boardId);
      await loadBoards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-blue border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-body">Loading boards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-ink">Your Boards</h2>
          <p className="text-body mt-1">
            {boards.length} board{boards.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(true)}
        >
          New Board
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-bg text-red rounded-lg">
          {error}
        </div>
      )}

      {/* Create Board Form */}
      {isCreating && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-ink mb-4">Create New Board</h3>
          <form onSubmit={handleCreateBoard} className="space-y-4">
            <Input
              autoFocus
              label="Board Title"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="My awesome board"
              fullWidth
              required
            />

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Description (optional)
              </label>
              <textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full px-4 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                type="submit"
                disabled={!newBoardTitle.trim()}
              >
                Create Board
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewBoardTitle('');
                  setNewBoardDescription('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Boards Grid */}
      {boards.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg border border-border">
          <p className="text-lg text-body mb-4">No boards yet</p>
          <Button variant="primary" onClick={() => setIsCreating(true)}>
            Create your first board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link key={board.id} href={`/boards/${board.id}`}>
              <div className="bg-surface border border-border rounded-lg p-6 hover:shadow-lg transition-shadow h-full cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-ink group-hover:text-blue transition-colors">
                    {board.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteBoard(board.id);
                    }}
                    className="text-muted hover:text-red transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete board"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {board.description && (
                  <p className="text-body text-sm mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{board.lists.length} lists</span>
                  <div className="flex gap-1">
                    {board.members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="w-6 h-6 bg-blue rounded-full flex items-center justify-center text-white text-xs"
                        title={member.name}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {board.members.length > 3 && (
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-white text-xs">
                        +{board.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
