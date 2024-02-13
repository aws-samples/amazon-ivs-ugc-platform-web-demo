import React, { useState } from 'react';

const ColorPickerModal = ({ selectedColor, onSelectColor, onClose }) => {
  const [currentColor, setCurrentColor] = useState(selectedColor);

  return (
    <div className="absolute right-0 top-0 mt-12 mr-4 bg-white shadow-lg p-4 rounded-lg z-10">
      <input
        type="color"
        value={currentColor}
        onChange={(e) => setCurrentColor(e.target.value)}
        className="w-full"
      />
      <div className="flex justify-end space-x-2 mt-4">
        <button
          className="btn"
          onClick={() => {
            onSelectColor(currentColor);
            onClose(); 
          }}
        >
          Select
        </button>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ColorPickerModal