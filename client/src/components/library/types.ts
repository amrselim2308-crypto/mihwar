import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";
import type { LibraryCountry } from "../../../../shared/library-catalog";

export type LibraryOutputs = inferRouterOutputs<AppRouter>;
export type LibraryResourceItem = LibraryOutputs["library"]["list"]["items"][number];
export type LibrarySavedItem = LibraryOutputs["library"]["saved"][number];
export type LibraryFiltersState = {
  countryCode: LibraryCountry | "";
  gradeCode: string;
  subjectCode: string;
  termCode: string;
  category: string;
  format: string;
  query: string;
};
