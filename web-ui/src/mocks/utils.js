export const reindexSessions = (sessions, startIndex) => {
  let currentIndex = startIndex;

  return sessions.map((session) => ({ ...session, index: currentIndex++ }));
};
