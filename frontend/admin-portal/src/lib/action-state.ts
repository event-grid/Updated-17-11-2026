import type { FormErrors } from "./forms";

/** What a form action returns to its form: field errors, a message and the values to put back. */
export type ActionState = {
  errors: FormErrors;
  message?: string;
  ok?: boolean;
  values?: Record<string, string>;
};

export const initialState: ActionState = { errors: {} };
