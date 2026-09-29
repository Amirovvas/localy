import z from "zod";
import { ALLOWED_REACTIONS } from "../utils/reactions";

export const toggleReactionSchema = z.object({
  emoji: z.enum(ALLOWED_REACTIONS, { message: "Недопустимая реакция" }),
});
