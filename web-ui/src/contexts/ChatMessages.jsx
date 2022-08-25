import { Outlet } from 'react-router-dom';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from 'react';

import { useUser } from './User';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'ChatMessages';

/**
 * @typedef {Object} SenderAttributes
 * @property {string} avatar
 * @property {string} color
 * @property {string} displayName
 *
 * @typedef {Object} Sender
 * @property {SenderAttributes} Attributes
 * @property {string} UserId
 *
 * @typedef {Object} Message
 * @property {object|null=} Attributes
 * @property {string} Content
 * @property {string} Id
 * @property {string=} RequestId
 * @property {Date} SendTime
 * @property {Sender} Sender
 * @property {string} Type
 *
 * @typedef {Array<Message>} Messages
 */

const actionTypes = {
  INIT_MESSAGES: 'INIT_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  DELETE_MESSAGES_BY_USER_ID: 'REMOVE_MESSAGES_BY_USER_ID'
};

const reducer = (messages, action) => {
  switch (action.type) {
    case actionTypes.INIT_MESSAGES: {
      return action.initialMessages || [];
    }
    case actionTypes.ADD_MESSAGE: {
      const { message: newMessage } = action;

      return [...messages, newMessage];
    }
    case actionTypes.DELETE_MESSAGE: {
      const { messageId: messageIdToDelete } = action;

      const newMessages = messages.filter(
        (msg) => msg.Id !== messageIdToDelete
      );

      return newMessages;
    }
    case actionTypes.DELETE_MESSAGES_BY_USER_ID: {
      const { userId: userIdToDelete } = action;

      const newMessages = messages.filter(
        (msg) => msg.Sender.UserId !== userIdToDelete
      );

      return newMessages;
    }
    default:
      throw new Error('Unexpected action type');
  }
};

export const Provider = () => {
  /** @type {[Messages, Function]} */
  const [messages, dispatch] = useReducer(reducer, []);
  const { userData, isSessionValid } = useUser();
  const { username: ownUsername } = userData || {};
  const chatRoomOwnerUsername = useRef();
  const savedMessages = useRef({});

  const initMessages = useCallback((chatRoomOwner) => {
    const initialMessages = savedMessages.current[chatRoomOwner] || [];

    chatRoomOwnerUsername.current = chatRoomOwner;
    dispatch({ type: actionTypes.INIT_MESSAGES, initialMessages });
  }, []);

  const addMessage = useCallback((message) => {
    dispatch({ type: actionTypes.ADD_MESSAGE, message });
  }, []);

  const removeMessage = useCallback((messageId) => {
    dispatch({
      type: actionTypes.DELETE_MESSAGE,
      messageId
    });
  }, []);

  const removeMessageByUserId = useCallback((userId) => {
    dispatch({
      type: actionTypes.DELETE_MESSAGES_BY_USER_ID,
      userId
    });
  }, []);

  // We are saving the chat messages in local state for only the currently signed-in user's chat room,
  // and removing them from local state once the user has signed out
  useEffect(() => {
    if (isSessionValid) {
      if (
        ownUsername &&
        chatRoomOwnerUsername.current &&
        chatRoomOwnerUsername.current === ownUsername
      ) {
        savedMessages.current[ownUsername] = messages;
      }
    } else {
      savedMessages.current = {};
    }
  }, [isSessionValid, messages, ownUsername]);

  const value = useMemo(
    () => ({
      addMessage,
      initMessages,
      messages,
      removeMessage,
      removeMessageByUserId
    }),
    [addMessage, initMessages, messages, removeMessage, removeMessageByUserId]
  );

  return (
    <Context.Provider value={value}>
      <Outlet />
    </Context.Provider>
  );
};

export const useChatMessages = () => useContextHook(Context);
