import type { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputNumberSchema = inputTextSchema.omit({ type: true });

export type InputNumberInput = z.input<typeof inputNumberSchema>;
