import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { encode } from 'html-entities';

import { channel as $channelContent } from '../../../../content';
import { channelAPI } from '../../../../api';
import { CHAT_CAPABILITY, CHAT_USER_ROLE } from './utils';
import { useNotif } from '../../../../contexts/Notification';

const $content = $channelContent.chat;

/**
 * @typedef {('VIEWER'|'SENDER'|'MODERATOR'|undefined)} ChatUserRole
 */

const useChatActions = ({ chatCapabilities, isConnectionOpen, connection }) => {
  const { notifyError, notifySuccess } = useNotif();

  /** @type {[ChatUserRole, Function]} */
  const [chatUserRole, setChatUserRole] = useState();

  const updateUserRole = useCallback(() => {
    let type;

    // Returns true if the user's chat capabilities contain all of the given required capabilities
    const hasPermission = (requiredCapabilities) =>
      requiredCapabilities.every((reqCap) =>
        chatCapabilities.current.includes(reqCap)
      );

    switch (true) {
      case hasPermission([
        CHAT_CAPABILITY.DISCONNECT_USER,
        CHAT_CAPABILITY.DELETE_MESSAGE
      ]): {
        type = CHAT_USER_ROLE.MODERATOR;
        break;
      }
      case hasPermission([CHAT_CAPABILITY.SEND_MESSAGE]): {
        type = CHAT_USER_ROLE.SENDER;
        break;
      }
      case hasPermission([CHAT_CAPABILITY.VIEW_MESSAGE]): {
        type = CHAT_USER_ROLE.VIEWER;
        break;
      }
      default: // exhaustive
    }

    setChatUserRole(type);
  }, [chatCapabilities]);

  const send = useCallback(
    (action, data) => {
      try {
        if (!isConnectionOpen)
          throw new Error(
            'Message or event failed to send because there is no open socket connection!'
          );

        connection.current.send(
          JSON.stringify({
            Action: action,
            RequestId: uuidv4(),
            ...data
          })
        );
      } catch (error) {
        console.error(error);
      }
    },
    [connection, isConnectionOpen]
  );

  // Actions
  const sendMessage = useCallback(
    (msg) => {
      if (
        ![CHAT_USER_ROLE.SENDER, CHAT_USER_ROLE.MODERATOR].includes(
          chatUserRole
        )
      ) {
        console.error(
          'You do not have permission to send messages to this channel!'
        );
        return;
      }

      send('SEND_MESSAGE', { Content: encode(msg) });
    },
    [chatUserRole, send]
  );

  const deleteMessage = useCallback(
    (messageId) => {
      if (chatUserRole !== CHAT_USER_ROLE.MODERATOR) {
        console.error(
          'You do not have permission to delete messages on this channel!'
        );
        return;
      }

      send('DELETE_MESSAGE', {
        Id: messageId,
        Reason: 'Deleted by moderator'
      });
    },
    [chatUserRole, send]
  );

  const banUser = useCallback(
    async (bannedUsername) => {
      if (chatUserRole !== CHAT_USER_ROLE.MODERATOR) {
        console.error(
          'You do not have permission to ban users on this channel!'
        );
        return;
      }

      const { result, error } = await channelAPI.banUser(bannedUsername);

      if (result) notifySuccess($content.notifications.success.user_banned);
      if (error) notifyError($content.notifications.error.ban_user);
    },
    [chatUserRole, notifyError, notifySuccess]
  );

  const unbanUser = useCallback(
    async (bannedUsername) => {
      if (chatUserRole !== CHAT_USER_ROLE.MODERATOR) {
        console.error(
          'You do not have permission to ban users on this channel!'
        );
        return;
      }

      const { result, error } = await channelAPI.unbanUser(bannedUsername);

      if (result) notifySuccess($content.notifications.success.user_unbanned);
      if (error) notifyError($content.notifications.error.unban_user);
    },
    [chatUserRole, notifyError, notifySuccess]
  );

  return {
    banUser,
    chatUserRole,
    deleteMessage,
    sendMessage,
    unbanUser,
    updateUserRole
  };
};

export default useChatActions;
