import { useContext } from 'react';

const useContextHook = (Context) => {
  const contextValue = useContext(Context);

  if (contextValue === null) {
    const contextName = Context.displayName;

    throw new Error(
      `${contextName} context must be consumed inside the ${contextName} Provider`
    );
  }

  return contextValue;
};

export default useContextHook;
