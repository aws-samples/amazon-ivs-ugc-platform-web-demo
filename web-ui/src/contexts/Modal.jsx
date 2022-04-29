import PropTypes from 'prop-types';
import { createContext, useCallback, useMemo, useState } from 'react';

import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'Modal';

export const Provider = ({ children }) => {
  const [modal, setModal] = useState(null);
  const openModal = useCallback((modalOptions) => setModal(modalOptions), []);
  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(
    () => ({ openModal, closeModal, modal }),
    [openModal, closeModal, modal]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useModal = () => useContextHook(Context);
