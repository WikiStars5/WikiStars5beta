
"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CommentThreadContextType {
  openCommentThread: (commentPath: string, highlightedReplyId: string | null) => void;
  closeCommentThread: () => void;
  commentThreadState: {
    isOpen: boolean;
    commentPath: string | null;
    highlightedReplyId: string | null;
  };
}

const CommentThreadContext = createContext<CommentThreadContextType | undefined>(undefined);

export function CommentThreadProvider({ children }: { children: ReactNode }) {
  const [commentThreadState, setCommentThreadState] = useState({
    isOpen: false,
    commentPath: null as string | null,
    highlightedReplyId: null as string | null,
  });

  const openCommentThread = useCallback((commentPath: string, highlightedReplyId: string | null) => {
    setCommentThreadState({
      isOpen: true,
      commentPath,
      highlightedReplyId,
    });
  }, []);

  const closeCommentThread = useCallback(() => {
    setCommentThreadState({
      isOpen: false,
      commentPath: null,
      highlightedReplyId: null,
    });
  }, []);

  const value = {
    openCommentThread,
    closeCommentThread,
    commentThreadState,
  };

  return (
    <CommentThreadContext.Provider value={value}>
      {children}
    </CommentThreadContext.Provider>
  );
}

export function useCommentThread() {
  const context = useContext(CommentThreadContext);
  if (context === undefined) {
    throw new Error('useCommentThread must be used within a CommentThreadProvider');
  }
  return context;
}
