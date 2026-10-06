import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Board } from '../types';
import { Button, Card } from '../components/Common/Button';

interface BoardListPageProps {
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name: string) => Promise<void>;
}

export const BoardListPage: React.FC<BoardListPageProps> = ({ onSelectBoard, onCreateBoard }) => {
  const { user, token, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBoardName, setNewBoardName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (token) {
      api.boards
        .list(token)
        .then((res) => {
          if (res.success) setBoards(res.data);
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !token) return;

    try {
      await onCreateBoard(newBoardName);
      setNewBoardName('');
      setShowCreateForm(false);
      const res = await api.boards.list(token);
      if (res.success) setBoards(res.data);
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Meus Quadros</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button variant="secondary" size="small" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>+ Novo Quadro</Button>
          ) : (
            <form onSubmit={handleCreate} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Nome do novo quadro"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <Button type="submit">Criar</Button>
              <Button variant="secondary" type="button" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </form>
          )}
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum quadro criado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Card
                key={board.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectBoard(board.id)}
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{board.name}</h3>
                <p className="text-sm text-gray-500">Criado em {new Date(board.createdAt).toLocaleDateString('pt-BR')}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
