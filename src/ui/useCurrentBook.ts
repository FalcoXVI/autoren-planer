import { useOutletContext } from "react-router-dom";
import type { Book } from "../domain/types";

/** The book whose pages are currently shown; provided by `BookPage` via the outlet context. */
export function useCurrentBook(): Book {
  return useOutletContext<Book>();
}
