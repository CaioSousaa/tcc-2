import { z } from "zod";
import { ROLES } from "../../shared/roles";
import { emailField } from "../auth/auth.schemas";

const role = z.enum(ROLES, { error: "Papel inválido." });

export const inviteMemberSchema = z.object({ email: emailField, role });
export const updateMemberRoleSchema = z.object({ role });

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
