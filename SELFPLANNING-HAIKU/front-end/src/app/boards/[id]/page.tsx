'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input } from '@/components';
import { List } from '@/components';
import { CardModal } from '@/components/modals/CardModal';
import { boardService, type Board, type Card as CardType } from '@/services/boardService';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'dueDate' | 'title'>('dueDate');

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  useEffect(() => {
    if (selectedCardId && board) {
      const card = findCardInBoard(board, selectedCardId);
      if (card) {
        setSelectedCard(card);
        setIsCardModalOpen(true);
      }
    }
  }, [selectedCardId, board]);

  const findCardInBoard = (b: Board, cardId: string): CardType | null => {
    for (const list of b.lists) {
      const card = list.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const loadBoard = async () => {
    try {
      setIsLoading(true);
      const response = await boardService.getBoardById(boardId);
      setBoard(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !board) return;

    try {
      await boardService.createList(board.id, { title: newListTitle.trim() });
      setNewListTitle('');
      setIsCreatingList(false);
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list');
    }
  };

  const handleAddCard = async (listId: string, title: string) => {
    try {
      await boardService.createCard(listId, { title });
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure? This will delete all cards in the list.')) return;
    try {
      await boardService.deleteList(listId);
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    }
  };

  const handleEditList = async (listId: string, title: string) => {
    try {
      await boardService.updateList(listId, { title });
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update list');
    }
  };

  const handleSaveCard = async (cardData: Partial<CardType>) => {
    if (!selectedCard) return;
    try {
      await boardService.updateCard(selectedCard.id, cardData);
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await boardService.deleteCard(cardId);
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete card');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-blue border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-body">Loading board...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <p className="text-red text-lg mb-4">Board not found</p>
        <Button variant="primary" onClick={() => router.push('/boards')}>
          Back to Boards
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-ink">{board.title}</h2>
          {board.description && (
            <p className="text-body mt-1">{board.description}</p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push('/boards')}
        >
          Back to Boards
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-bg text-red rounded-lg">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-surface p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-ink">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'title')}
            className="px-3 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="dueDate">Due Date</option>
            <option value="title">Title</option>
          </select>
        </div>

        {board.labels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-ink">Filter by label:</label>
            {board.labels.map((label) => (
              <button
                key={label.id}
                onClick={() => {
                  setFilterLabels((prev) =>
                    prev.includes(label.id)
                      ? prev.filter((l) => l !== label.id)
                      : [...prev, label.id]
                  );
                }}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  filterLabels.includes(label.id)
                    ? 'ring-2 ring-blue'
                    : 'bg-surface-alt'
                }`}
              >
                {label.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Board Lists */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {board.lists.map((list) => (
          <List
            key={list.id}
            list={list}
            onCardClick={(cardId) => setSelectedCardId(cardId)}
            onAddCard={handleAddCard}
            onDeleteList={handleDeleteList}
            onEditList={handleEditList}
          />
        ))}

        {/* Add List Button */}
        <div className="flex-shrink-0 w-80">
          {isCreatingList ? (
            <div className="bg-surface-alt rounded-lg p-4 space-y-3">
              <Input
                autoFocus
                placeholder="Enter list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateList(e);
                  if (e.key === 'Escape') {
                    setIsCreatingList(false);
                    setNewListTitle('');
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleCreateList}
                  disabled={!newListTitle.trim()}
                >
                  Add List
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCreatingList(false);
                    setNewListTitle('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingList(true)}
              className="w-full bg-surface-alt hover:bg-surface border border-border rounded-lg p-4 text-left text-body font-medium transition-colors"
            >
              + Add another list
            </button>
          )}
        </div>
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          isOpen={isCardModalOpen}
          card={selectedCard}
          labels={board.labels}
          boardMembers={board.members}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedCard(null);
            setSelectedCardId(null);
          }}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}
