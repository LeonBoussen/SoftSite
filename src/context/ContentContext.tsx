import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { SiteContent } from "../lib/types";
import { DEFAULT_CONTENT } from "../lib/content";
import { fetchContent } from "../lib/api";

const ContentContext = createContext<SiteContent>(DEFAULT_CONTENT);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    let active = true;
    fetchContent()
      .then((c) => {
        if (active) setContent(c);
      })
      .catch(() => {
        /* blijf bij de fallback-content */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
  );
}

export function useContent(): SiteContent {
  return useContext(ContentContext);
}
