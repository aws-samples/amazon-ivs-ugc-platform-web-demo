import { useCallback } from 'react';

import {
  addImageLayer,
  addVideoLayerByDeviceId,
  addVideoLayerByStream
} from './layers';
import { client } from '../Broadcast';
import useMap from '../../../hooks/useMap';

export const LAYER_TYPE = {
  VIDEO: 'VIDEO',
  IMAGE: 'IMAGE',
  SCREEN_SHARE: 'SCREEN_SHARE'
};
export const CAMERA_LAYER_NAME = 'camera';

const useLayers = () => {
  const layers = useMap({}, true);
  const hiddenLayers = useMap();
  const layerGroupCompositions = useMap({}, true);

  const getLayer = useCallback(
    (layerName) => layers.get(layerName) || hiddenLayers.get(layerName),
    [layers, hiddenLayers]
  );

  const doesLayerExist = useCallback(
    (layerName) => layers.has(layerName) || hiddenLayers.has(layerName),
    [layers, hiddenLayers]
  );

  const isLayerHidden = useCallback(
    (layerName) => hiddenLayers.has(layerName),
    [hiddenLayers]
  );

  const removeLayer = useCallback(
    (layerName) => {
      if (!doesLayerExist(layerName)) return;

      const { type } = getLayer(layerName) || {};
      const device = client?.getVideoInputDevice(layerName);

      switch (type) {
        case LAYER_TYPE.VIDEO:
        case LAYER_TYPE.SCREEN_SHARE: {
          if (device) {
            for (const track of device.source.getVideoTracks()) track.stop();

            client.removeVideoInputDevice(layerName);
          }
          break;
        }
        case LAYER_TYPE.IMAGE: {
          if (device) client.removeImage(layerName);
          break;
        }
        default:
          console.error(`Unknown layer type to remove: ${type}`);
      }

      layers.delete(layerName);
    },
    [doesLayerExist, getLayer, layers]
  );

  const updateLayer = useCallback(
    (layerName, composition) => {
      if (!layerName || !composition || !doesLayerExist(layerName)) return;

      const layerData = getLayer(layerName);
      const canvasDimensions = client?.getCanvasDimensions();
      const nextComposition = {
        index: layerData.position.index, // by default, preserve existing layer index
        ...(typeof composition === 'function'
          ? composition(canvasDimensions)
          : composition)
      };
      const nextLayerData = { ...layerData, position: nextComposition };

      if (isLayerHidden(layerName)) {
        hiddenLayers.set(layerName, nextLayerData);

        return nextComposition;
      }

      try {
        client?.updateVideoDeviceComposition(layerName, nextComposition);
        layers.set(layerName, nextLayerData);

        return nextComposition;
      } catch (error) {
        console.error(
          `Failed to update composition for ${layerData.type} layer: ${layerName}`,
          error
        );
      }
    },
    [doesLayerExist, getLayer, isLayerHidden, hiddenLayers, layers]
  );

  const updateLayerGroup = useCallback(
    (layerGroupId, composition) => {
      if (!layerGroupId || !composition) return;

      // Retrieve all of the layers pertaining to the layer group given by layerGroupId
      const layerGroupEntries = [
        ...layers.entries(),
        ...hiddenLayers.entries()
      ].filter(([_, layerData]) => layerData.layerGroupId === layerGroupId);

      // Update every layer from layerGroupEntries with the new composition
      for (const [layerName] of layerGroupEntries)
        updateLayer(layerName, composition);

      // Update the layer group compositions map with the new composition for layerGroupId
      const canvasDimensions = client.getCanvasDimensions();
      const newLayerGroupComposition =
        typeof composition === 'function'
          ? composition(canvasDimensions)
          : composition;
      layerGroupCompositions.set(layerGroupId, newLayerGroupComposition);
    },
    [hiddenLayers, layerGroupCompositions, layers, updateLayer]
  );

  const addLayer = useCallback(
    async ({ data, name, type }) => {
      if (!name || !data || !type) return;

      const { hidden, ...restData } = data;
      const { layerGroupId, position } = restData;
      const layerGroupComposition = layerGroupCompositions.get(layerGroupId);
      const composition = {
        index: 0, // default composition
        ...layerGroupComposition,
        ...position
      };
      const layerData = { ...restData, position: composition };

      // If a layer with the same name has already been added, or it is
      // currently hidden, remove it before replacing it with a new one.
      removeLayer(name);
      hiddenLayers.delete(name);

      if (hidden) {
        hiddenLayers.set(name, { ...layerData, type });

        return true;
      } else layers.set(name, { ...layerData, type });

      try {
        switch (type) {
          case LAYER_TYPE.VIDEO: {
            await addVideoLayerByDeviceId({ name, data: layerData });
            break;
          }
          case LAYER_TYPE.SCREEN_SHARE: {
            await addVideoLayerByStream({ name, data: layerData });
            break;
          }
          case LAYER_TYPE.IMAGE: {
            await addImageLayer({ name, data: layerData });
            break;
          }
          default: {
            console.error(`Unknown layer type to add: ${type}`);

            return false;
          }
        }

        // If the layer was hidden during the time that it was being
        // added to the broadcast stream, then remove it.
        if (isLayerHidden(name)) removeLayer(name);

        if (layerGroupId) {
          const { index, ...restComposition } = composition;
          const currentLayerGroupComposition =
            layerGroupCompositions.get(layerGroupId);

          if (currentLayerGroupComposition)
            // Update the composition of this layer in case its layer group composition
            // changed during the time that it was being added to the broadcast stream
            updateLayer(name, { index, ...currentLayerGroupComposition });
          else {
            // Set the initial composition if one does not yet exist for the layer group
            // that this layer pertains to, excluding the index to allow for correct
            // layer stacking order within the group
            layerGroupCompositions.set(layerGroupId, restComposition);
          }
        }

        return true;
      } catch (error) {
        console.error(`Failed to add ${type} layer: ${name}`, error);
        removeLayer(name);

        return false;
      }
    },
    [
      layerGroupCompositions,
      removeLayer,
      hiddenLayers,
      layers,
      isLayerHidden,
      updateLayer
    ]
  );

  const toggleLayer = useCallback(
    (layerName, { shouldHide } = {}) => {
      if (!doesLayerExist(layerName)) return;

      const isHiddenNext = shouldHide ?? !isLayerHidden(layerName);

      if (isHiddenNext) {
        // Hide (remove) layer
        const layer = layers.get(layerName);
        hiddenLayers.set(layerName, layer);
        removeLayer(layerName);
      } else {
        // Show (add) layer
        const hiddenLayer = hiddenLayers.get(layerName);
        const { type, ...data } = hiddenLayer;
        hiddenLayers.delete(layerName);
        addLayer({ data, name: layerName, type });
      }

      return isHiddenNext;
    },
    [doesLayerExist, addLayer, removeLayer, layers, hiddenLayers, isLayerHidden]
  );

  const _addVideoLayer = useCallback(
    (layerName, data) =>
      addLayer({ data, name: layerName, type: LAYER_TYPE.VIDEO }),
    [addLayer]
  );
  const _addScreenShareLayer = useCallback(
    (layerName, data) =>
      addLayer({ data, name: layerName, type: LAYER_TYPE.SCREEN_SHARE }),
    [addLayer]
  );
  const _addImageLayer = useCallback(
    (layerName, data) =>
      addLayer({ data, name: layerName, type: LAYER_TYPE.IMAGE }),
    [addLayer]
  );

  return {
    addVideoLayer: _addVideoLayer,
    addScreenShareLayer: _addScreenShareLayer,
    addImageLayer: _addImageLayer,
    toggleLayer,
    updateLayerGroup,
    removeLayer,
    isLayerHidden
  };
};

export default useLayers;
