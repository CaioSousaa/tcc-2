import { Router } from "express";
import { ensureAuthenticated } from "./middlewares/auth";
import * as auth from "./controllers/auth.controller";
import * as boards from "./controllers/boards.controller";
import * as lists from "./controllers/lists.controller";
import * as cards from "./controllers/cards.controller";
import * as checklists from "./controllers/checklists.controller";
import * as labels from "./controllers/labels.controller";
import * as comments from "./controllers/comments.controller";
import * as members from "./controllers/members.controller";
import * as search from "./controllers/search.controller";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Autenticação
routes.post("/auth/register", auth.register);
routes.post("/auth/login", auth.login);
routes.get("/auth/me", ensureAuthenticated, auth.me);

// A partir daqui todas as rotas exigem autenticação
const privateRoutes = Router();
privateRoutes.use(ensureAuthenticated);

// Busca global (quadros e cards do usuário)
privateRoutes.get("/search", search.search);

// Quadros
privateRoutes.get("/boards", boards.listBoards);
privateRoutes.post("/boards", boards.createBoard);
privateRoutes.get("/boards/:boardId", boards.getBoard);
privateRoutes.patch("/boards/:boardId", boards.updateBoard);
privateRoutes.delete("/boards/:boardId", boards.deleteBoard);

// Listas
privateRoutes.post("/boards/:boardId/lists", lists.createList);
privateRoutes.put("/boards/:boardId/lists/order", lists.reorderLists);
privateRoutes.patch("/lists/:listId", lists.updateList);
privateRoutes.delete("/lists/:listId", lists.deleteList);

// Cards
privateRoutes.post("/lists/:listId/cards", cards.createCard);
privateRoutes.get("/cards/:cardId", cards.getCard);
privateRoutes.patch("/cards/:cardId", cards.updateCard);
privateRoutes.delete("/cards/:cardId", cards.deleteCard);
privateRoutes.patch("/cards/:cardId/move", cards.moveCard);
privateRoutes.post("/cards/:cardId/labels", cards.addLabelToCard);
privateRoutes.delete("/cards/:cardId/labels/:labelId", cards.removeLabelFromCard);
privateRoutes.post("/cards/:cardId/assignees", cards.addAssignee);
privateRoutes.delete("/cards/:cardId/assignees/:userId", cards.removeAssignee);

// Checklists
privateRoutes.post("/cards/:cardId/checklists", checklists.createChecklist);
privateRoutes.patch("/checklists/:checklistId", checklists.updateChecklist);
privateRoutes.delete("/checklists/:checklistId", checklists.deleteChecklist);
privateRoutes.post("/checklists/:checklistId/items", checklists.createChecklistItem);
privateRoutes.patch("/checklist-items/:itemId", checklists.updateChecklistItem);
privateRoutes.delete("/checklist-items/:itemId", checklists.deleteChecklistItem);

// Etiquetas
privateRoutes.post("/boards/:boardId/labels", labels.createLabel);
privateRoutes.patch("/labels/:labelId", labels.updateLabel);
privateRoutes.delete("/labels/:labelId", labels.deleteLabel);

// Comentários
privateRoutes.get("/cards/:cardId/comments", comments.listComments);
privateRoutes.post("/cards/:cardId/comments", comments.createComment);
privateRoutes.patch("/comments/:commentId", comments.updateComment);
privateRoutes.delete("/comments/:commentId", comments.deleteComment);

// Membros e convites
privateRoutes.patch("/boards/:boardId/members/:userId", members.updateMemberRole);
privateRoutes.delete("/boards/:boardId/members/:userId", members.removeMember);
privateRoutes.get("/boards/:boardId/invitations", members.listBoardInvitations);
privateRoutes.post("/boards/:boardId/invitations", members.createInvitation);
privateRoutes.patch("/invitations/:invitationId", members.updateInvitationRole);
privateRoutes.delete("/invitations/:invitationId", members.cancelInvitation);
privateRoutes.get("/invitations", members.listMyInvitations);
privateRoutes.post("/invitations/:invitationId/accept", members.acceptInvitation);
privateRoutes.post("/invitations/:invitationId/decline", members.declineInvitation);

routes.use(privateRoutes);
