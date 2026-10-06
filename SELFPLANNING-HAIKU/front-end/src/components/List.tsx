import React, { useState } from 'react';
import { Card as CardComponent } from './Card';
import { Button } from './Button';
import { Input } from './Input';

interface CardData {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  labels?: Array<{ id: string; name: string; color: string }>;
  assignees?: Array<{ id: string; name: string; email: string }>;
  checklistCount?: number;
  completedChecklistCount?: number;
  commentCount?: number;
}

interface ListData {
  id: string;
  title: string;
  cards: CardData[];
}

interface ListProps {
  list: ListData;
  onCardClick?: (cardId: string) => void;
  onAddCard?: (listId: string, title: string) => void;
  onDeleteList?: (listId: string) => void;
  onEditList?: (listId: string, title: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function List({
  list,
  onCardClick,
  onAddCard,
  onDeleteList,
  onEditList,
  draggable = false,
  onDragStart,
  onDrop,
  onDragOver,
}: ListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);

  const handleAddCard = () => {
    if (newCardTitle.trim() && onAddCard) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAdding(false);
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && onEditList) {
      onEditList(list.id, editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-80 bg-surface-alt rounded-lg flex flex-col h-fit max-h-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* List Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {isEditingTitle ? (
          <input
            autoFocus
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            className="flex-1 px-2 py-1 bg-surface border border-border rounded text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-blue"
          />
        ) : (
          <h3
            className="font-semibold text-ink flex-1 cursor-pointer hover:text-blue"
            onClick={() => setIsEditingTitle(true)}
          >
            {list.title}
          </h3>
        )}
        <button
          onClick={() => onDeleteList?.(list.id)}
          className="text-muted hover:text-red transition-colors p-1"
          title="Delete list"
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

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {list.cards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted">No cards yet</p>
          </div>
        ) : (
          list.cards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              onClick={() => onCardClick?.(card.id)}
              draggable={draggable}
              onDragStart={(e) => onDragStart?.(e, card.id)}
            />
          ))
        )}
      </div>

      {/* Add Card Section */}
      <div className="p-3 border-t border-border">
        {isAdding ? (
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="Enter card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCardTitle('');
                }
              }}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewCardTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full text-left text-sm text-body hover:bg-surface rounded px-3 py-2 transition-colors"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
