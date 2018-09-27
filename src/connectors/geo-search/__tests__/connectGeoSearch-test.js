import last from 'lodash/last';
import first from 'lodash/first';
import algoliasearchHelper, { SearchResults } from 'algoliasearch-helper';
import connectGeoSearch from '../connectGeoSearch';

const createFakeHelper = client => {
  const helper = algoliasearchHelper(client);

  helper.search = jest.fn();

  return helper;
};

const firstRenderArgs = fn => first(fn.mock.calls)[0];
const lastRenderArgs = fn => last(fn.mock.calls)[0];

describe('connectGeoSearch', () => {
  it('expect to be a widget', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();

    expect(widget).toEqual({
      init: expect.any(Function),
      render: expect.any(Function),
      dispose: expect.any(Function),
    });
  });

  it('expect to render twice during init and render', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();

    const client = {};
    const helper = createFakeHelper(client);
    const instantSearchInstance = { client, helper };

    widget.init({
      state: helper.state,
      instantSearchInstance,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenLastCalledWith(
      {
        items: [],
        position: undefined,
        refine: expect.any(Function),
        clearMapRefinement: expect.any(Function),
        isRefinedWithMap: expect.any(Function),
        toggleRefineOnMapMove: expect.any(Function),
        isRefineOnMapMove: expect.any(Function),
        setMapMoveSinceLastRefine: expect.any(Function),
        hasMapMoveSinceLastRefine: expect.any(Function),
        widgetParams: {},
        instantSearchInstance,
      },
      true
    );

    expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(true);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);

    widget.render({
      results: new SearchResults(helper.getState(), [
        {
          hits: [
            { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
            { objectID: 456, _geoloc: { lat: 12, lng: 14 } },
            { objectID: 789, _geoloc: { lat: 14, lng: 16 } },
          ],
        },
      ]),
      helper,
      instantSearchInstance,
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        items: [
          { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
          { objectID: 456, _geoloc: { lat: 12, lng: 14 } },
          { objectID: 789, _geoloc: { lat: 14, lng: 16 } },
        ],
        position: undefined,
        refine: expect.any(Function),
        clearMapRefinement: expect.any(Function),
        toggleRefineOnMapMove: expect.any(Function),
        setMapMoveSinceLastRefine: expect.any(Function),
        widgetParams: {},
        instantSearchInstance,
      }),
      false
    );

    expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(true);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
  });

  it('expect to render with enableRefineOnMapMove disabled', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch({
      enableRefineOnMapMove: false,
    });

    const helper = createFakeHelper({});

    widget.init({
      state: helper.state,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(1);
    expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(false);

    widget.render({
      results: new SearchResults(helper.getState(), [
        {
          hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
        },
      ]),
      helper,
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(false);
  });

  it('expect to render with only geoloc hits', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();

    const helper = createFakeHelper({});

    widget.render({
      results: new SearchResults(helper.getState(), [
        {
          hits: [
            { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
            { objectID: 456 },
            { objectID: 789, _geoloc: { lat: 10, lng: 12 } },
          ],
        },
      ]),
      helper,
    });

    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        items: [
          { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
          { objectID: 789, _geoloc: { lat: 10, lng: 12 } },
        ],
      }),
      false
    );
  });

  it('expect to render with transformed hits', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch({
      transformItems: items =>
        items.map(item => ({
          ...item,
          _geoloc: {
            lat: 20,
            lng: 20,
          },
        })),
    });

    const helper = createFakeHelper({});

    widget.render({
      results: new SearchResults(helper.getState(), [
        {
          hits: [
            { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
            { objectID: 456 },
            { objectID: 789, _geoloc: { lat: 10, lng: 12 } },
          ],
        },
      ]),
      helper,
    });

    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        items: [
          { objectID: 123, _geoloc: { lat: 20, lng: 20 } },
          { objectID: 789, _geoloc: { lat: 20, lng: 20 } },
        ],
      }),
      false
    );
  });

  it('expect to render with position', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();
    const helper = createFakeHelper({});

    // Simulate the configuration or external setter
    helper.setQueryParameter('aroundLatLng', '10, 12');

    widget.init({
      helper,
      state: helper.state,
    });

    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        position: {
          lat: 10,
          lng: 12,
        },
      }),
      true
    );

    widget.render({
      results: new SearchResults(helper.getState(), [
        {
          hits: [],
        },
      ]),
      helper,
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        position: {
          lat: 10,
          lng: 12,
        },
      }),
      false
    );

    // Simulate the configuration or external setter
    helper.setQueryParameter('aroundLatLng', '12, 14');

    widget.render({
      results: new SearchResults(helper.getState(), [
        {
          hits: [],
        },
      ]),
      helper,
    });

    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        position: {
          lat: 12,
          lng: 14,
        },
      }),
      false
    );
  });

  it('expect to reset the map state when position changed', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();

    const helper = createFakeHelper({});

    const northEast = {
      lat: 12,
      lng: 10,
    };

    const southWest = {
      lat: 40,
      lng: 42,
    };

    const results = new SearchResults(helper.getState(), [
      {
        hits: [
          { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
          { objectID: 456 },
          { objectID: 789, _geoloc: { lat: 10, lng: 12 } },
        ],
      },
    ]);

    helper.setQueryParameter('aroundLatLng', '10,12');

    widget.render({
      results,
      helper,
    });

    lastRenderArgs(render).refine({ northEast, southWest });

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    lastRenderArgs(render).setMapMoveSinceLastRefine();

    expect(render).toHaveBeenCalledTimes(3);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    helper.setQueryParameter('aroundLatLng', '14,16');

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(4);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
  });

  it("expect to not reset the map state when position don't changed", () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();

    const helper = createFakeHelper({});

    const northEast = {
      lat: 12,
      lng: 10,
    };

    const southWest = {
      lat: 40,
      lng: 42,
    };

    const results = new SearchResults(helper.getState(), [
      {
        hits: [
          { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
          { objectID: 456 },
          { objectID: 789, _geoloc: { lat: 10, lng: 12 } },
        ],
      },
    ]);

    helper.setQueryParameter('aroundLatLng', '10,12');

    widget.render({
      results,
      helper,
    });

    lastRenderArgs(render).refine({ northEast, southWest });

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    lastRenderArgs(render).setMapMoveSinceLastRefine();

    expect(render).toHaveBeenCalledTimes(3);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    helper.setQueryParameter('aroundLatLng', '10,12');

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(4);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
  });

  it('expect to reset the map state when boundingBox is reset', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();

    const helper = createFakeHelper({});

    const northEast = {
      lat: 12,
      lng: 10,
    };

    const southWest = {
      lat: 40,
      lng: 42,
    };

    const results = new SearchResults(helper.getState(), [
      {
        hits: [
          { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
          { objectID: 456 },
          { objectID: 789, _geoloc: { lat: 10, lng: 12 } },
        ],
      },
    ]);

    helper.setQueryParameter('insideBoundingBox', '10,12,14,16');

    widget.render({
      results,
      helper,
    });

    lastRenderArgs(render).refine({ northEast, southWest });

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    lastRenderArgs(render).setMapMoveSinceLastRefine();

    expect(render).toHaveBeenCalledTimes(3);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    helper.setQueryParameter('insideBoundingBox');

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(4);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
  });

  it('expect to not reset the map state when boundingBox is preserve', () => {
    const render = jest.fn();
    const unmount = jest.fn();

    const customGeoSearch = connectGeoSearch(render, unmount);
    const widget = customGeoSearch();

    const helper = createFakeHelper({});

    const northEast = {
      lat: 12,
      lng: 10,
    };

    const southWest = {
      lat: 40,
      lng: 42,
    };

    const results = new SearchResults(helper.getState(), [
      {
        hits: [
          { objectID: 123, _geoloc: { lat: 10, lng: 12 } },
          { objectID: 456 },
          { objectID: 789, _geoloc: { lat: 10, lng: 12 } },
        ],
      },
    ]);

    helper.setQueryParameter('insideBoundingBox', '10,12,14,16');

    widget.render({
      results,
      helper,
    });

    lastRenderArgs(render).refine({ northEast, southWest });

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    lastRenderArgs(render).setMapMoveSinceLastRefine();

    expect(render).toHaveBeenCalledTimes(3);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);

    helper.setQueryParameter('insideBoundingBox', '12,14,16,18');

    widget.render({
      results,
      helper,
    });

    expect(render).toHaveBeenCalledTimes(4);
    expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
    expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
  });

  describe('currentRefinement', () => {
    it('expect to render with currentRefinement from a string', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();
      const helper = createFakeHelper({});

      // Simulate the configuration or external setter (like URLSync)
      helper.setQueryParameter('insideBoundingBox', '10,12,12,14');

      widget.init({
        helper,
        state: helper.state,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(lastRenderArgs(render).currentRefinement).toEqual({
        northEast: {
          lat: 10,
          lng: 12,
        },
        southWest: {
          lat: 12,
          lng: 14,
        },
      });

      widget.render({
        results: new SearchResults(helper.getState(), [
          {
            hits: [],
          },
        ]),
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(lastRenderArgs(render).currentRefinement).toEqual({
        northEast: {
          lat: 10,
          lng: 12,
        },
        southWest: {
          lat: 12,
          lng: 14,
        },
      });

      // Simulate the configuration or external setter (like URLSync)
      helper.setQueryParameter('insideBoundingBox');

      widget.render({
        results: new SearchResults(helper.getState(), [
          {
            hits: [],
          },
        ]),
        helper,
      });

      expect(render).toHaveBeenCalledTimes(3);
      expect(lastRenderArgs(render).currentRefinement).toBeUndefined();
    });

    it('expect to render with currentRefinement from an array', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();
      const helper = createFakeHelper({});

      helper.setQueryParameter('insideBoundingBox', [[10, 12, 12, 14]]);

      widget.init({
        helper,
        state: helper.state,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(lastRenderArgs(render).currentRefinement).toEqual({
        northEast: {
          lat: 10,
          lng: 12,
        },
        southWest: {
          lat: 12,
          lng: 14,
        },
      });

      widget.render({
        results: new SearchResults(helper.getState(), [
          {
            hits: [],
          },
        ]),
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(lastRenderArgs(render).currentRefinement).toEqual({
        northEast: {
          lat: 10,
          lng: 12,
        },
        southWest: {
          lat: 12,
          lng: 14,
        },
      });

      // Simulate the configuration or external setter (like URLSync)
      helper.setQueryParameter('insideBoundingBox');

      widget.render({
        results: new SearchResults(helper.getState(), [
          {
            hits: [],
          },
        ]),
        helper,
      });

      expect(render).toHaveBeenCalledTimes(3);
      expect(lastRenderArgs(render).currentRefinement).toBeUndefined();
    });
  });

  describe('refine', () => {
    it('expect to refine with the given bounds during init', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      const northEast = {
        lat: 12,
        lng: 10,
      };

      const southWest = {
        lat: 40,
        lng: 42,
      };

      const results = new SearchResults(helper.getState(), [
        {
          hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
        },
      ]);

      widget.init({
        state: helper.state,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
      expect(helper.getState().insideBoundingBox).toBe(undefined);
      expect(helper.search).not.toHaveBeenCalled();

      lastRenderArgs(render).refine({ northEast, southWest });

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(helper.getState().insideBoundingBox).toEqual('12,10,40,42');
      expect(helper.search).toHaveBeenCalledTimes(1);
    });

    it('expect to refine with the given bounds during render', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      const northEast = {
        lat: 12,
        lng: 10,
      };

      const southWest = {
        lat: 40,
        lng: 42,
      };

      const results = new SearchResults(helper.getState(), [
        {
          hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
        },
      ]);

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
      expect(helper.getState().insideBoundingBox).toBe(undefined);
      expect(helper.search).not.toHaveBeenCalled();

      lastRenderArgs(render).refine({ northEast, southWest });

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(helper.getState().insideBoundingBox).toEqual('12,10,40,42');
      expect(helper.search).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearMapRefinement', () => {
    it('expect to clear the map refinement after the map has been refine during init', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      const northEast = {
        lat: 12,
        lng: 10,
      };

      const southWest = {
        lat: 40,
        lng: 42,
      };

      const results = new SearchResults(helper.getState(), [
        {
          hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
        },
      ]);

      widget.init({
        state: helper.state,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
      expect(helper.getState().insideBoundingBox).toBe(undefined);
      expect(helper.search).not.toHaveBeenCalled();

      lastRenderArgs(render).refine({ northEast, southWest });

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(helper.getState().insideBoundingBox).toEqual('12,10,40,42');
      expect(helper.search).toHaveBeenCalledTimes(1);

      lastRenderArgs(render).clearMapRefinement();

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(3);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
      expect(helper.getState().insideBoundingBox).toBe(undefined);
      expect(helper.search).toHaveBeenCalledTimes(2);
    });

    it('expect to clear the map refinement after the map has been refine during render', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      const northEast = {
        lat: 12,
        lng: 10,
      };

      const southWest = {
        lat: 40,
        lng: 42,
      };

      const results = new SearchResults(helper.getState(), [
        {
          hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
        },
      ]);

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
      expect(helper.getState().insideBoundingBox).toBe(undefined);
      expect(helper.search).not.toHaveBeenCalled();

      lastRenderArgs(render).refine({ northEast, southWest });

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(true);
      expect(helper.getState().insideBoundingBox).toEqual('12,10,40,42');
      expect(helper.search).toHaveBeenCalledTimes(1);

      lastRenderArgs(render).clearMapRefinement();

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(3);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);
      expect(lastRenderArgs(render).isRefinedWithMap()).toBe(false);
      expect(helper.getState().insideBoundingBox).toBe(undefined);
      expect(helper.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('toggleRefineOnMapMove', () => {
    it('expect to toggle refine on map move during init', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      widget.init({
        state: helper.state,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(true);

      lastRenderArgs(render).toggleRefineOnMapMove();

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(false);

      widget.render({
        results: new SearchResults(helper.getState(), [
          {
            hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
          },
        ]),
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(false);
      expect(firstRenderArgs(render).toggleRefineOnMapMove).toBe(
        lastRenderArgs(render).toggleRefineOnMapMove
      );
    });

    it('expect to toggle refine on map move during render', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      widget.render({
        results: new SearchResults(helper.getState(), [
          {
            hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
          },
        ]),
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(true);

      lastRenderArgs(render).toggleRefineOnMapMove();

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).isRefineOnMapMove()).toBe(false);
      expect(firstRenderArgs(render).toggleRefineOnMapMove).toBe(
        lastRenderArgs(render).toggleRefineOnMapMove
      );
    });
  });

  describe('setMapMoveSinceLastRefine', () => {
    it('expect to set map move during init', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      widget.init({
        state: helper.state,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);

      lastRenderArgs(render).setMapMoveSinceLastRefine();

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);

      widget.render({
        results: new SearchResults(helper.getState(), [
          {
            hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
          },
        ]),
        helper,
      });

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
      expect(firstRenderArgs(render).setMapMoveSinceLastRefine).toBe(
        lastRenderArgs(render).setMapMoveSinceLastRefine
      );
    });

    it('expect to set map move during render', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      const results = new SearchResults(helper.getState(), [
        {
          hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
        },
      ]);

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);

      lastRenderArgs(render).setMapMoveSinceLastRefine();

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
      expect(firstRenderArgs(render).setMapMoveSinceLastRefine).toBe(
        lastRenderArgs(render).setMapMoveSinceLastRefine
      );
    });

    it('expect to set map move during render & trigger render only when value change', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();

      const helper = createFakeHelper({});

      const results = new SearchResults(helper.getState(), [
        {
          hits: [{ objectID: 123, _geoloc: { lat: 10, lng: 12 } }],
        },
      ]);

      widget.render({
        results,
        helper,
      });

      expect(render).toHaveBeenCalledTimes(1);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(false);

      lastRenderArgs(render).setMapMoveSinceLastRefine();

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);

      lastRenderArgs(render).setMapMoveSinceLastRefine();

      expect(render).toHaveBeenCalledTimes(2);
      expect(lastRenderArgs(render).hasMapMoveSinceLastRefine()).toBe(true);
      expect(firstRenderArgs(render).setMapMoveSinceLastRefine).toBe(
        lastRenderArgs(render).setMapMoveSinceLastRefine
      );
    });
  });

  describe('dispose', () => {
    it('expect reset insideBoundingBox', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customGeoSearch = connectGeoSearch(render, unmount);
      const widget = customGeoSearch();
      const helper = createFakeHelper({});

      helper.setQueryParameter('insideBoundingBox', '10,12,12,14');

      const expectation = {
        insideBoundingBox: undefined,
      };

      const actual = widget.dispose({ state: helper.getState() });

      expect(unmount).toHaveBeenCalled();
      expect(actual).toMatchObject(expectation);
    });
  });
});
