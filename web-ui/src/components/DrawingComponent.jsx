import React, { useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';

const DrawingComponent = forwardRef(({
    startDrawing,
    draw,
    endDrawing,
    initializeCanvas
  }, ref) => {

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  return (
    <canvas
      ref={ref}
      onMouseDown={startDrawing}
      onMouseUp={endDrawing}
      onMouseMove={draw}
      style={{ border: '1px solid black' }}
    />
  );
});

DrawingComponent.propTypes = {
  startDrawing: PropTypes.func.isRequired,
  draw: PropTypes.func.isRequired,
  endDrawing: PropTypes.func.isRequired,
  initializeCanvas: PropTypes.func.isRequired
};

export default DrawingComponent;
