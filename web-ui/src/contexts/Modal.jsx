import { createContext, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { useLastFocusedElement } from './LastFocusedElement';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'Modal';

export const Provider = ({ children }) => {
  const [modal, setModal] = useState(null);
  const { setLastFocusedElement } = useLastFocusedElement();
  const openModal = useCallback(
    (modalOptions) => {
      if (modalOptions.lastFocusedElement) {
        setLastFocusedElement(modalOptions.lastFocusedElement.current);
      }

      setModal(modalOptions);
    },
    [setLastFocusedElement]
  );
  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(
    () => ({ openModal, closeModal, modal }),
    [openModal, closeModal, modal]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useModal = () => useContextHook(Context);
