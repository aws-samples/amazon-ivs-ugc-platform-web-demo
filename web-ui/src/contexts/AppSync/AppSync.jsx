import { createContext, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { graphqlOperation, API } from '@aws-amplify/api';

import { publishDoc, subscribeDoc } from './graphql';
import useContextHook from '../useContextHook';
import { useUser } from '../User';

const Context = createContext(null);
Context.displayName = 'AppSync';

export const Provider = ({ children }) => {
  const { userData } = useUser();

  /**
   * @param  {string} name the name of the channel
   * @param  {Object} data the data to publish to the channel
   */
  const publish = useCallback(async (name, data) => {
    return await API.graphql(graphqlOperation(publishDoc, { name, data }));
  }, []);

  /**
   * @param  {string} name the name of the channel
   * @param  {nextCallback} next callback function that will be called with subscription payload data
   * @param  {function} [error] optional function to handle errors
   * @returns {Observable} an observable subscription object
   */
  const subscribe = useCallback((name, next, error) => {
    return API.graphql(graphqlOperation(subscribeDoc, { name })).subscribe({
      next: ({ provider, value }) => {
        next(value.data.subscribe, provider, value);
      },
      error: error || console.log
    });
  }, []);

  useEffect(() => {
    if (!userData?.username) return;

    const channel = userData?.username;
    const subscription = subscribe(channel, ({ data }) => {
      const messageReceived = JSON.parse(data);

      console.log('Message received', messageReceived);

      // TODO: parse messages here
    });
    return () => subscription.unsubscribe();
  }, [subscribe, userData?.username]);

  const value = useMemo(
    () => ({
      publish
    }),
    [publish]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useAppSync = () => useContextHook(Context);
