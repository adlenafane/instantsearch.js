/* eslint-env jest, jasmine */
/* eslint-disable no-console */

import createInstantSearchManager from './createInstantSearchManager';

import algoliaClient from 'algoliasearch';

jest.useFakeTimers();

jest.mock('algoliasearch-helper/src/algoliasearch.helper.js', () => {
  let count = 0;
  const Helper = require.requireActual('algoliasearch-helper/src/algoliasearch.helper.js');
  Helper.prototype._handleResponse = function(state) {
    this.emit('result', {count: count++}, state);
  };
  return Helper;
});

const client = algoliaClient('latency', '249078a3d4337a8231f1665ec5a44966');
client.search = jest.fn((queries, cb) => {
  if (cb) {
    setImmediate(() => {
      // We do not care about the returned values because we also control how
      // it will handle in the helper
      cb(null, null);
    });
    return undefined;
  }

  return new Promise(resolve => {
    // cf comment above
    resolve(null);
  });
});

describe('createInstantSearchManager', () => {
  describe('with correct result from algolia', () => {
    describe('on widget lifecycle', () => {
      it('updates the store and searches', () => {
        const ism = createInstantSearchManager({
          indexName: 'index',
          initialState: {},
          searchParameters: {},
          algoliaClient: client,
        });

        ism.widgetsManager.registerWidget({
          getSearchParameters: params => params.setQuery('search'),
        });

        expect(ism.store.getState().results).toBe(null);

        jest.runAllTimers();

        const store = ism.store.getState();
        expect(store.results).toEqual({count: 0});
        expect(store.error).toBe(null);

        ism.widgetsManager.update();

        jest.runAllTimers();

        const store1 = ism.store.getState();
        expect(store1.results).toEqual({count: 1});
        expect(store1.error).toBe(null);
      });
    });
    describe('on external updates', () => {
      it('updates the store and searches', () => {
        const ism = createInstantSearchManager({
          indexName: 'index',
          initialState: {},
          searchParameters: {},
          algoliaClient: client,
        });

        ism.onExternalStateUpdate({});

        expect(ism.store.getState().results).toBe(null);

        jest.runAllTimers();

        const store = ism.store.getState();
        expect(store.results).toEqual({count: 2});
        expect(store.error).toBe(null);
      });
    });
  });
});
