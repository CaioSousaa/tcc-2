import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { BoardListPage } from './components/BoardListPage';
import { BoardViewPage } from './components/BoardViewPage';
import { api } from './services/api';

type Page = 'login' | 'register' | 'boards' | 'board-view';

const AppContent: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  // If user is logged in and not on a specific board
  if (token && user && (currentPage === 'login' || currentPage === 'register')) {
    setCurrentPage('boards');
  }

  // If user is not logged in, show auth pages
  if (!token || !user) {
    return (
      <>
        {currentPage === 'register' ? (
          <RegisterPage
            onSuccess={() => setCurrentPage('boards')}
            onSwitchToLogin={() => setCurrentPage('login')}
          />
        ) : (
          <LoginPage
            onSuccess={() => setCurrentPage('boards')}
            onSwitchToRegister={() => setCurrentPage('register')}
          />
        )}
      </>
    );
  }

  // User is logged in
  if (currentPage === 'board-view' && selectedBoardId) {
    return (
      <BoardViewPage
        boardId={selectedBoardId}
        onBack={() => {
          setCurrentPage('boards');
          setSelectedBoardId(null);
        }}
      />
    );
  }

  return (
    <BoardListPage
      onSelectBoard={(boardId) => {
        setSelectedBoardId(boardId);
        setCurrentPage('board-view');
      }}
      onCreateBoard={async (name) => {
        if (token) {
          const res = await api.boards.create(token, name);
          if (!res.success) throw new Error(res.message);
        }
      }}
    />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
