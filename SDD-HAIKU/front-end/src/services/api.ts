const API_BASE = 'http://localhost:3333/api';

export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      }).then(r => r.json()),

    login: (email: string, password: string) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json()),

    getMe: (token: string) =>
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
  },

  boards: {
    list: (token: string) =>
      fetch(`${API_BASE}/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),

    create: (token: string, name: string) =>
      fetch(`${API_BASE}/boards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }).then(r => r.json()),

    getById: (token: string, boardId: string) =>
      fetch(`${API_BASE}/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),

    update: (token: string, boardId: string, name: string) =>
      fetch(`${API_BASE}/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }).then(r => r.json()),

    delete: (token: string, boardId: string) =>
      fetch(`${API_BASE}/boards/${boardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
  },

  lists: {
    create: (token: string, boardId: string, name: string) =>
      fetch(`${API_BASE}/boards/${boardId}/lists`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }).then(r => r.json()),

    update: (token: string, listId: string, name: string) =>
      fetch(`${API_BASE}/lists/${listId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }).then(r => r.json()),

    delete: (token: string, listId: string) =>
      fetch(`${API_BASE}/lists/${listId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
  },

  cards: {
    create: (token: string, listId: string, title: string) =>
      fetch(`${API_BASE}/lists/${listId}/cards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      }).then(r => r.json()),

    getById: (token: string, cardId: string) =>
      fetch(`${API_BASE}/cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),

    update: (token: string, cardId: string, data: any) =>
      fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then(r => r.json()),

    delete: (token: string, cardId: string) =>
      fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),

    move: (token: string, cardId: string, listId: string) =>
      fetch(`${API_BASE}/cards/${cardId}/list`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listId }),
      }).then(r => r.json()),
  },

  comments: {
    getByCard: (token: string, cardId: string) =>
      fetch(`${API_BASE}/cards/${cardId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),

    create: (token: string, cardId: string, text: string) =>
      fetch(`${API_BASE}/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }).then(r => r.json()),
  },

  labels: {
    getByBoard: (token: string, boardId: string) =>
      fetch(`${API_BASE}/boards/${boardId}/labels`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),

    create: (token: string, boardId: string, name: string, color: string) =>
      fetch(`${API_BASE}/boards/${boardId}/labels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, color }),
      }).then(r => r.json()),
  },

  checklists: {
    create: (token: string, cardId: string, title: string) =>
      fetch(`${API_BASE}/cards/${cardId}/checklists`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      }).then(r => r.json()),

    createItem: (token: string, checklistId: string, text: string) =>
      fetch(`${API_BASE}/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }).then(r => r.json()),

    updateItem: (token: string, itemId: string, completed: boolean) =>
      fetch(`${API_BASE}/checklists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      }).then(r => r.json()),
  },
};
