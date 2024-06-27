import { renderToStaticMarkup } from 'react-dom/server';

import { client } from '../../Broadcast';

export const IMAGE_LAYER_TYPE = { IMAGE: 'image', CANVAS: 'canvas' };

const createImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) reject('Missing source for image layer.');

    const timeoutId = setTimeout(reject, 5000);
    const image = new Image();
    image.src = src;

    image.addEventListener(
      'load',
      (e) => {
        resolve(e.target);
        clearTimeout(timeoutId);
      },
      { once: true }
    );
    image.addEventListener('error', (error) => {
      reject(error);
      clearTimeout(timeoutId);
    });
  });

export const addImageLayer = async ({ name, data }) => {
  if (!name || !data) return;

  const { tag = IMAGE_LAYER_TYPE.IMAGE, position = { index: 0 } } = data;

  switch (tag) {
    case IMAGE_LAYER_TYPE.IMAGE: {
      const image = await createImage(data.src);

      await client.addImageSource(image, name, position);

      return image;
    }
    case IMAGE_LAYER_TYPE.CANVAS: {
      if (!client) return;

      const { fill, drawings } = data;

      const canvas = document.createElement('canvas');
      const canvasDimensions = client.getCanvasDimensions();
      canvas.width = canvasDimensions.width;
      canvas.height = canvasDimensions.height;

      const ctx = canvas.getContext('2d');
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const images =
        drawings && typeof drawings === 'function'
          ? await Promise.allSettled(
              drawings(canvasDimensions)
                .filter(({ svg }) => !!svg)
                .map(async ({ svg, ...restData }) => {
                  let src;

                  try {
                    src = URL.createObjectURL(
                      new Blob([renderToStaticMarkup(svg)], {
                        type: 'image/svg+xml;charset=utf-8'
                      })
                    );
                    const image = await createImage(src);

                    return { image, ...restData };
                  } finally {
                    URL.revokeObjectURL(src);
                  }
                })
            )
          : [];

      for (const { value } of images) {
        const { image, dx = 0, dy = 0 } = value || {};
        image && ctx.drawImage(image, dx, dy);
      }

      await client.addImageSource(canvas, name, position);

      return canvas;
    }
    default: {
      console.warn(`Unexpected image layer type: ${tag}`);
      return;
    }
  }
};

export default addImageLayer;
