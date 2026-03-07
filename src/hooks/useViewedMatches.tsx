"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "ppb-viewed";

interface ViewedMatchesContextValue {
  isViewed: (id: string) => boolean;
  markViewed: (id: string) => void;
}

const ViewedMatchesContext = createContext<ViewedMatchesContextValue>({
  isViewed: () => false,
  markViewed: () => {},
});

type Action = { type: "init"; ids: Set<string> } | { type: "add"; id: string };

function reducer(state: Set<string>, action: Action): Set<string> {
  switch (action.type) {
    case "init":
      return action.ids;
    case "add": {
      if (state.has(action.id)) return state;
      const next = new Set(state);
      next.add(action.id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    }
  }
}

export function ViewedMatchesProvider({ children }: { children: ReactNode }) {
  const [viewedIds, dispatch] = useReducer(reducer, new Set<string>());

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
      dispatch({ type: "init", ids: new Set(ids) });
    } catch {}
  }, []);

  const isViewed = useCallback((id: string) => viewedIds.has(id), [viewedIds]);

  const markViewed = useCallback((id: string) => {
    dispatch({ type: "add", id });
  }, []);

  return (
    <ViewedMatchesContext value={{ isViewed, markViewed }}>
      {children}
    </ViewedMatchesContext>
  );
}

export function useViewedMatches() {
  return useContext(ViewedMatchesContext);
}
