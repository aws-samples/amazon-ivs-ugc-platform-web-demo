import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layer, Line, Stage } from 'react-konva';
import ColorPickerModal from './ColorPicker';
import useDebouncedEventQueue, {
  convertStringToJSON
} from '../hooks/useDebouncedEventQueue';
import { Undo, Redo, Clear } from '../../../assets/icons/index.js';
const maxQueueSize = 40;
const initialCanvasState = {
  userLines: {},
  undoStacks: {},
  redoStacks: {}
};
const referenceDimensions = {
  width: 1000,
  height: 800
};
const baseStrokeWidth = 5;

const SharedCanvas = ({
  activeUser,
  sendDrawEvents,
  receiveDrawEvents,
  dimensions
}) => {
  const [canvasState, setCanvasState] = useState(initialCanvasState);
  // const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#df4b26');

  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);

  const scaleFactorRef = useRef({
    x: 0,
    y: 0
  });

  const commonMultiplier =
    (scaleFactorRef.current.x + scaleFactorRef.current.y) / 2;

  const adjustedStrokeWidth = baseStrokeWidth * commonMultiplier;

  const queueEvent = useDebouncedEventQueue(
    activeUser,
    maxQueueSize,
    sendDrawEvents
  );

  useEffect(() => {
    // const updateCanvasSize = () => {
    //   if (dimensions) {
    //     const containerWidth = containerRef.current.offsetWidth;
    //     const height = containerWidth / aspectRatio; // Maintain aspect ratio
    //     setDimensions({ width: containerWidth, height });
    //     scaleFactorRef.current = {
    //       x: +(containerWidth / referenceDimensions.width).toFixed(3),
    //       y: +(height / referenceDimensions.height).toFixed(3)
    //     };
    //   }
    // };

    // window.addEventListener('resize', updateCanvasSize);
    // updateCanvasSize();

    // return () => window.removeEventListener('resize', updateCanvasSize);
    if (dimensions) {
      const { width, height } = dimensions;

      scaleFactorRef.current = {
        x: +(width / referenceDimensions.width).toFixed(3),
        y: +(height / referenceDimensions.height).toFixed(3)
      };
    }
  }, [dimensions]);

  useEffect(() => {
    const handleDrawingEvent = (message) => {
      const data =
        message?.includes('UNDO') || message?.includes('REDO')
          ? JSON.parse(message)
          : convertStringToJSON(message);

      if (data.action === 'DRAW_EVENTS' && activeUser !== data.user) {
        handleIncomingDrawEvent(data);
      } else if (data.action === 'UNDO') {
        performUndo(data.user);
      } else if (data.action === 'REDO') {
        performRedo(data.user);
      }
    };

    receiveDrawEvents(handleDrawingEvent);

    return () => receiveDrawEvents(null);
  }, [receiveDrawEvents, sendDrawEvents]);

  const handleIncomingDrawEvent = useCallback(
    (data) => {
      console.log('handleIncomingDrawEvent', data);
      data.events.forEach((event) => {
        setCanvasState((prevCanvasState) => {
          const userLines = prevCanvasState.userLines[data.user] || [];
          let newLines;
          if (event.type === 'mousedown') {
            newLines = [
              ...userLines,
              {
                tool: 'pen',
                points: [
                  parseInt(event.x * scaleFactorRef.current.x),
                  parseInt(event.y * scaleFactorRef.current.y)
                ],
                color: event.color || '#000'
              }
            ];
          } else if (event.type === 'mousemove') {
            newLines = userLines.map((line, index) =>
              index === userLines.length - 1
                ? {
                    ...line,
                    points: line.points.concat([
                      parseInt(event.x * scaleFactorRef.current.x),
                      parseInt(event.y * scaleFactorRef.current.y)
                    ])
                  }
                : line
            );
          } else if (event.type === 'mouseup') {
            newLines = [...userLines];
            updateUndoStacks(data.user, newLines);
          }

          return {
            ...prevCanvasState,
            userLines: { ...prevCanvasState.userLines, [data.user]: newLines }
          };
        });
      });
    },
    [setCanvasState, selectedColor, scaleFactorRef]
  );

  const handleMouseDown = useCallback(
    (e) => {
      const currentUser = activeUser;
      isDrawingRef.current = true;

      setCanvasState((prevCanvasState) => {
        const newUserLines = [
          ...(prevCanvasState.userLines[currentUser] || []),
          {
            tool: 'pen',
            points: [e.evt.layerX, e.evt.layerY],
            color: selectedColor || '#000000'
          }
        ];

        return {
          ...prevCanvasState,
          userLines: {
            ...prevCanvasState.userLines,
            [currentUser]: newUserLines
          }
        };
      });

      queueEvent({
        type: 'mousedown',
        x: parseInt(e.evt.layerX / scaleFactorRef.current.x),
        y: parseInt(e.evt.layerY / scaleFactorRef.current.y),
        user: currentUser,
        color: selectedColor || '#000000'
      });
    },

    [activeUser, setCanvasState, selectedColor, dimensions, scaleFactorRef]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawingRef.current) return;
      const currentUser = activeUser;

      setCanvasState((prevCanvasState) => {
        const currentUserLines = prevCanvasState.userLines[currentUser] || [];
        if (currentUserLines.length === 0) {
          return prevCanvasState;
        }

        const lastLineIndex = currentUserLines.length - 1;
        const lastLine = currentUserLines[lastLineIndex];
        const newPoints = lastLine.points.concat([e.evt.layerX, e.evt.layerY]);

        const newUserLines = {
          ...prevCanvasState.userLines,
          [currentUser]: [
            ...currentUserLines.slice(0, lastLineIndex),
            { ...lastLine, points: newPoints }
          ]
        };

        return {
          ...prevCanvasState,
          userLines: newUserLines
        };
      });

      queueEvent({
        type: 'mousemove',
        x: parseInt(e.evt.layerX / scaleFactorRef.current.x),
        y: parseInt(e.evt.layerY / scaleFactorRef.current.y),
        user: currentUser
      });
    },
    [activeUser, setCanvasState, dimensions, scaleFactorRef]
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    const currentUser = activeUser;
    updateUndoStacks(currentUser);

    queueEvent({ type: 'mouseup', user: currentUser });
  }, [activeUser, setCanvasState, dimensions]);

  const updateUndoStacks = useCallback(
    (currentUser) => {
      setCanvasState((prevCanvasState) => {
        const userLines = prevCanvasState.userLines[currentUser] || [];
        if (!userLines.length) return prevCanvasState;

        const userUndoStacks = prevCanvasState.undoStacks[currentUser] || [];
        const newUserUndoStacks =
          userUndoStacks.length >= 5
            ? userUndoStacks.slice(1).concat([userLines])
            : userUndoStacks.concat([userLines]);

        return {
          ...prevCanvasState,
          undoStacks: {
            ...prevCanvasState.undoStacks,
            [currentUser]: newUserUndoStacks
          }
        };
      });
    },
    [setCanvasState]
  );

  const performUndo = useCallback(
    (currentUser) => {
      setCanvasState((prevCanvasState) => {
        const userUndoStacks = prevCanvasState.undoStacks[currentUser] || [];

        if (userUndoStacks.length === 0) return prevCanvasState;

        const newStateToUndo = userUndoStacks[userUndoStacks.length - 1];

        const newUserUndoStacks = userUndoStacks.slice(0, -1);

        const newUserRedoStacks = [
          ...(prevCanvasState.redoStacks[currentUser] || []),
          newStateToUndo
        ];

        const linesToSet =
          newUserUndoStacks.length > 0
            ? newUserUndoStacks[newUserUndoStacks.length - 1]
            : [];

        return {
          ...prevCanvasState,
          undoStacks: {
            ...prevCanvasState.undoStacks,
            [currentUser]: newUserUndoStacks
          },
          redoStacks: {
            ...prevCanvasState.redoStacks,
            [currentUser]: newUserRedoStacks
          },
          userLines: {
            ...prevCanvasState.userLines,
            [currentUser]: linesToSet
          }
        };
      });
    },
    [setCanvasState]
  );

  const performRedo = useCallback(
    (currentUser) => {
      setCanvasState((prevCanvasState) => {
        const userRedoStacks = [
          ...(prevCanvasState.redoStacks[currentUser] || [])
        ];
        if (userRedoStacks.length === 0) return prevCanvasState;

        const newStateToRedo = userRedoStacks.pop();

        const newUserUndoStacks = [
          ...(prevCanvasState.undoStacks[currentUser] || []),
          newStateToRedo
        ];

        const newUserLines = {
          ...prevCanvasState.userLines,
          [currentUser]: newStateToRedo
        };

        return {
          ...prevCanvasState,
          undoStacks: {
            ...prevCanvasState.undoStacks,
            [currentUser]: newUserUndoStacks
          },
          userLines: newUserLines,
          redoStacks: {
            ...prevCanvasState.redoStacks,
            [currentUser]: userRedoStacks
          }
        };
      });
    },
    [setCanvasState]
  );

  const handleUndo = useCallback(() => {
    performUndo(activeUser);
    sendDrawEvents(JSON.stringify({ action: 'UNDO', user: activeUser }));
  }, [activeUser, sendDrawEvents]);

  const handleRedo = useCallback(() => {
    performRedo(activeUser);
    sendDrawEvents(JSON.stringify({ action: 'REDO', user: activeUser }));
  }, [activeUser, sendDrawEvents]);

  const handleButtonAction = (action) => {
    console.log(`${action} button clicked`);
    if (action === 'Color') {
      setShowColorPicker(!showColorPicker);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  const clearAll = useCallback(() => {
    setCanvasState((prevCanvasState) => {
      return {
        ...prevCanvasState,
        undoStacks: {
          ...prevCanvasState.undoStacks,
          [activeUser]: []
        },
        userLines: { ...prevCanvasState.userLines, [activeUser]: [] },
        redoStacks: {
          ...prevCanvasState.redoStacks,
          [activeUser]: []
        }
      };
    });
  }, [activeUser, sendDrawEvents]);

  return (
    <div
      className="absolute top-0 left-0 w-full h-full"
      style={{
        width: dimensions.width + 'px',
        height: dimensions.height + 'px'
      }}
    >
      <div className="relative flex justify-center items-center w-full h-full">
        <div
          ref={containerRef}
          className="w-full h-full  border overflow-hidden relative  flex items-center justify-center"
        >
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {/* <Rect
              width={dimensions.width}
              height={dimensions.height}
              fill="#808080" 
            /> */}
              {Object.entries(canvasState.userLines).map(
                ([userId, userLines]) =>
                  userLines.map((line, i) => (
                    <Line
                      key={`${userId}-${i}`}
                      points={line.points}
                      stroke={line.color || '#df4b26'}
                      strokeWidth={adjustedStrokeWidth}
                      tension={0.5}
                      lineCap="round"
                      globalCompositeOperation="source-over"
                    />
                  ))
              )}
              {/* {isDrawingRef.current && (
              <Text
                x={mousePosition.x}
                y={mousePosition.y}
                text={activeUser}
                fontSize={14}
                fill="black"
                offsetX={-10}
                offsetY={10}
              />
            )} */}
            </Layer>
          </Stage>

          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4"></div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
            {/* <button
            className="btn" 
            onClick={() => handleButtonAction("Action 1")}
          >
            Pen
          </button>
          <button
            className="btn" 
            onClick={() => handleButtonAction("Action 1")}
          >
            Eraser
          </button> */}

            <button
              className="p-1  rounded bg-white items-center justify-center"
              onClick={() => handleButtonAction('Color')}
            >
              <p
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: selectedColor
                }}
              ></p>
            </button>
            {!!canvasState.undoStacks[activeUser]?.length && (
              <button
                className="btn mx-2"
                onClick={handleUndo}
                disabled={canvasState.undoStacks[activeUser].length === 0}
              >
                <Undo style={{ height: 40 }} />
              </button>
            )}
            {!!canvasState.redoStacks[activeUser]?.length && (
              <button
                className="btn m-2"
                onClick={handleRedo}
                disabled={canvasState.redoStacks[activeUser].length === 0}
              >
                <Redo style={{ height: 40 }} />
              </button>
            )}

            {(!!canvasState.redoStacks[activeUser]?.length ||
              !!canvasState.undoStacks[activeUser]?.length) && (
              <button className="btn m-2" onClick={clearAll}>
                <Clear style={{ height: 40 }} />
              </button>
            )}

            {showColorPicker && (
              <ColorPickerModal
                selectedColor={selectedColor}
                onSelectColor={handleColorSelect}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedCanvas;
