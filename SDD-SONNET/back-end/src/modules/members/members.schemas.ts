import { z } from "zod";
import { emailField, roleField } from "../../shared/validation";

export const inviteSchema = z.object({
  email: emailField,
  role: roleField,
});

export const changeRoleSchema = z.object({
  role: roleField,
});
