import React from 'react';
import { Avatar } from './Avatar';
import { Label } from './Label';

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

interface CardProps {
  card: CardData;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

export function Card({
  card,
  onClick,
  draggable = false,
  onDragStart,
  className = '',
}: CardProps) {
  const isDueSoon = card.dueDate && new Date(card.dueDate) < new Date();
  const isChecklistComplete =
    card.checklistCount && card.completedChecklistCount === card.checklistCount;

  return (
    <div
      className={`
        bg-surface border border-border rounded-lg p-3
        hover:shadow-md transition-all cursor-pointer
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
        ${className}
      `}
      onClick={onClick}
      onDragStart={onDragStart}
      draggable={draggable}
    >
      {/* Card Title */}
      <h3 className="font-semibold text-ink text-sm mb-2 line-clamp-2">
        {card.title}
      </h3>

      {/* Card Description */}
      {card.description && (
        <p className="text-xs text-body mb-2 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.slice(0, 3).map((label) => (
            <Label
              key={label.id}
              name={label.name}
              color={label.color}
              small
              onClick={() => {}}
            />
          ))}
          {card.labels.length > 3 && (
            <span className="text-xs text-muted">
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between">
        {/* Left: Checklists, Comments, Due Date */}
        <div className="flex items-center gap-2 text-xs text-muted">
          {card.checklistCount && (
            <div
              className={`flex items-center gap-1 ${
                isChecklistComplete ? 'text-green' : ''
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 3.062v6.018a1 1 0 01-.09.49l-1.432 2.987a3 3 0 01-2.68 1.665H9.04a3 3 0 01-2.68-1.665l-1.431-2.987a1 1 0 01-.09-.49V6.517a3.066 3.066 0 012.812-3.062zM9 6.5a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {card.completedChecklistCount}/{card.checklistCount}
            </div>
          )}
          {card.commentCount && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                <path
                  d="M6.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM13.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
                  opacity="0.2"
                />
              </svg>
              {card.commentCount}
            </div>
          )}
          {card.dueDate && (
            <div className={isDueSoon ? 'text-red' : ''}>
              {new Date(card.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Right: Assignees */}
        {card.assignees && card.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {card.assignees.slice(0, 2).map((assignee) => (
              <Avatar
                key={assignee.id}
                name={assignee.name}
                size="sm"
                className="border border-surface"
              />
            ))}
            {card.assignees.length > 2 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-white text-xs border border-surface">
                +{card.assignees.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
