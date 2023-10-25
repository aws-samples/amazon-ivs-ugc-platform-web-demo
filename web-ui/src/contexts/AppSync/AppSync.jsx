import { createContext, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { graphqlOperation, API } from '@aws-amplify/api';

import { publishDoc, subscribeDoc } from './graphql';
import useContextHook from '../useContextHook';

const Context = createContext(null);
Context.displayName = 'AppSync';

export const Provider = ({ children }) => {
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
    // console.log('userData.username ==>', userData?.username)
    const subscription = subscribe('/channel', ({ data }) => {
      // TODO: Published events to your channel will be processed here
      console.log('Event published to your channel ==>', data);
    });
    return () => subscription.unsubscribe();
  }, [subscribe]);

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
