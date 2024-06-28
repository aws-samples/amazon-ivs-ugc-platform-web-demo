import { CAMERA_LAYER_NAME } from '.';
import { VideoCameraOff } from '../../../assets/icons';
import { IMAGE_LAYER_TYPE } from './layers';

const BACKGROUND_LAYER_NAME = 'background';
const NO_CAMERA_LAYER_NAME = 'no-camera';

export const createBackgroundLayerPreset = ({
  addImageLayer,
  removeLayer
}) => ({
  add: () =>
    addImageLayer(BACKGROUND_LAYER_NAME, {
      tag: IMAGE_LAYER_TYPE.CANVAS,
      fill: 'hsl(0, 0%, 80%)',
      position: { index: -1 }
    }),
  remove: () => removeLayer(BACKGROUND_LAYER_NAME)
});

export const createNoCameraLayerPreset = ({ addImageLayer, removeLayer }) => ({
  add: () =>
    addImageLayer(NO_CAMERA_LAYER_NAME, {
      tag: IMAGE_LAYER_TYPE.CANVAS,
      layerGroupId: CAMERA_LAYER_NAME,
      position: { index: 2 },
      fill: 'hsl(0, 0%, 80%)',
      drawings: ({ width: canvasWidth, height: canvasHeight }) => [
        {
          svg: (
            <VideoCameraOff
              fill="hsla(0, 0%, 0%, 0.5)"
              width={canvasWidth / 8}
              height={canvasWidth / 8}
            />
          ),
          dx: (7 * canvasWidth) / 16,
          dy: (canvasHeight - canvasWidth / 8) / 2
        }
      ]
    }),
  remove: () => removeLayer(NO_CAMERA_LAYER_NAME)
});
