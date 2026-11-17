/**
 * Classes for the `<ul>` that holds cards inside a ViewSwitcher: a responsive grid that becomes one column
 * in list view. Kept apart from ViewSwitcher.tsx because that file is a client module.
 */
export const CARD_LIST_CLASS =
  "grid gap-5 sm:grid-cols-2 xl:grid-cols-3 group-data-[view=list]/view:grid-cols-1 group-data-[view=list]/view:sm:grid-cols-1 group-data-[view=list]/view:xl:grid-cols-1";
