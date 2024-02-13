import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { encode } from 'html-entities';

import { channel as $channelContent } from '../../../../content';
import { channelAPI } from '../../../../api';
import { CHAT_CAPABILITY, CHAT_USER_ROLE, SEND_ERRORS } from './utils';
import {
  DeleteMessageRequest,
  DisconnectUserRequest,
  SendMessageRequest
} from 'amazon-ivs-chat-messaging';
import { useNotif } from '../../../../contexts/Notification';

const $content = $channelContent.notifications;

/**
 * @typedef {('VIEWER'|'SENDER'|'MODERATOR'|undefined)} ChatUserRole
 */

const useChatActions = ({
  chatCapabilities,
  isConnectionOpen,
  connection,
  setSendAttemptError
}) => {
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
    async (content, attributes = {}) => {
      try {
        // if (!isConnectionOpen)
        //   throw new Error(
        //     'Message or event failed to send because there is no open socket connection!'
        //   );

        const sendRequestId = uuidv4();
        const sendRequest = new SendMessageRequest(
          content,
          attributes,
          sendRequestId
        );

        await connection.current.sendMessage(sendRequest);
        return true;
      } catch (error) {
        if (Object.values(SEND_ERRORS).indexOf(error.errorMessage) > -1) {
          setSendAttemptError({
            message: error.errorMessage
          });
        }

        console.error(error);
      }
      return false;
    },
    [connection, isConnectionOpen, setSendAttemptError]
  );

  // Actions
  const sendMessage = useCallback(
    (msg, attr = {}) => {
      if (
        ![CHAT_USER_ROLE.SENDER, CHAT_USER_ROLE.MODERATOR].includes(
          chatUserRole
        ) && msg !== 'NOTIFY_USER_JOIN' && msg !== 'NOTIFY_USER_LEAVE' && msg !== 'NOTIFY_ALL_USERS' && msg !== 'DRAW_EVENTS'
      ) {
        console.error(
          'You do not have permission to send messages to this channel!'
        );
        return;
      }

      return send(encode(msg), attr);
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

      const deleteMessageRequest = new DeleteMessageRequest(messageId);
      connection.current.deleteMessage(deleteMessageRequest);
    },
    [chatUserRole, connection]
  );

  const banUser = useCallback(
    async (bannedChannelArn) => {
      if (!bannedChannelArn) {
        console.error(
          'Please provide a channelArn to ban a user on this channel!'
        );
        return;
      }
      if (chatUserRole !== CHAT_USER_ROLE.MODERATOR) {
        console.error(
          'You do not have permission to ban users on this channel!'
        );
        return;
      }

      const { result, error } = await channelAPI.banUser(bannedChannelArn);
      if (error) notifyError($content.error.ban_user);
      if (result) {
        // send a request to disconnect user
        const disconnectUserRequest = new DisconnectUserRequest(
          bannedChannelArn,
          'Kicked by moderator'
        );

        connection.current.disconnectUser(disconnectUserRequest);

        notifySuccess($content.success.user_banned);
      }
    },
    [chatUserRole, connection, notifyError, notifySuccess]
  );

  const unbanUser = useCallback(
    async (bannedChannelArn) => {
      if (!bannedChannelArn) {
        console.error(
          'Please provide a channelArn to unban a user on this channel!'
        );
        return;
      }
      if (chatUserRole !== CHAT_USER_ROLE.MODERATOR) {
        console.error(
          'You do not have permission to unban users on this channel!'
        );
        return;
      }

      const { result, error } = await channelAPI.unbanUser(bannedChannelArn);

      if (result) notifySuccess($content.success.user_unbanned);
      if (error) notifyError($content.error.unban_user);
    },
    [chatUserRole, notifyError, notifySuccess]
  );

  const actions = useMemo(
    () => ({ banUser, deleteMessage, sendMessage, unbanUser }),
    [banUser, deleteMessage, sendMessage, unbanUser]
  );

  return { actions, chatUserRole, updateUserRole };
};

export default useChatActions;
