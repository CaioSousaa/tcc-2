import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Board, List, Card } from '../types';
import { Button, Card as CardComponent } from '../components/Common/Button';

interface BoardViewPageProps {
  boardId: string;
  onBack: () => void;
}

export const BoardViewPage: React.FC<BoardViewPageProps> = ({ boardId, onBack }) => {
  const { token } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    if (token && boardId) {
      Promise.all([
        api.boards.getById(token, boardId),
        api.boards.getById(token, boardId), // Will fetch lists too
      ])
        .then(([boardRes]) => {
          if (boardRes.success) {
            setBoard(boardRes.data);
            setLists(boardRes.data.lists || []);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [token, boardId]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || !token) return;

    try {
      const res = await api.lists.create(token, boardId, newListName);
      if (res.success) {
        setLists([...lists, res.data]);
        setNewListName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={onBack} className="text-blue-600 hover:underline mb-2">
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{board?.name}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Criar nova lista"
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <Button onClick={handleCreateList}>+ Adicionar Lista</Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.length === 0 ? (
            <div className="text-center py-12 w-full">
              <p className="text-gray-500">Nenhuma lista criada ainda</p>
            </div>
          ) : (
            lists.map((list) => (
              <div key={list.id} className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-3">{list.name}</h3>
                <div className="space-y-2">
                  {list.cards?.map((card) => (
                    <CardComponent key={card.id} className="bg-white">
                      <p className="font-medium text-gray-900">{card.title}</p>
                      {card.dueDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Prazo: {new Date(card.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </CardComponent>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
