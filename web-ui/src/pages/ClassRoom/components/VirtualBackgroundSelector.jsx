import React, { useState, useMemo } from 'react';

const backgrounds = [
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://plus.unsplash.com/premium_photo-1677474827615-31ea6fa13efe?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1558274803-5addf237d6dd?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
];

const VirtualBackgroundSelector = ({ toggleBackground, isOpen, setIsOpen }) => {
  const [selectedBg, setSelectedBg] = useState('');
  const [bgMode, setBgMode] = useState('');

  const handleApplyBg = () => {
    toggleBackground(true, selectedBg, bgMode);
    setSelectedBg('');
    setBgMode('');
    setIsOpen(false);
  };

  const handleRemoveBg = () => {
    toggleBackground(false, '', 'blur');
    setSelectedBg('');
    setBgMode('');
    setIsOpen(false);
  };

  const blurOption = useMemo(
    () => ({
      src: 'https://img.freepik.com/free-photo/white-wall-textures_74190-6114.jpg',
      mode: 'blur'
    }),
    []
  );

  const handleSelectBg = (background, mode = 'image') => {
    setSelectedBg(background);
    setBgMode(mode);
  };

  return (
    <div
      className={`fixed top-48 right-0 h-full ${
        isOpen ? 'w-96' : 'w-0'
      } transition-width  overflow-hidden z-10 rounded`}
    >
      <div className="flex flex-wrap items-center justify-center h-1/8 p-4 bg-gray-100 overflow-y-auto border shadow ">
      <div className="flex justify-between items-center w-full p-4 bg-gray-100 border-b border-gray-300">
  <h5 className="font-bold">Select Background</h5>
  <button
    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
    onClick={  ()=>  setIsOpen(false)
    }
  >
    Close
  </button>
</div>

        <div
          className={`p-2 ${
            bgMode === blurOption.mode ? 'border-4 border-indigo-500/75' : ''
          }`}
        >
          <img
            src={blurOption.src}
            alt="Blur"
            className="w-24 h-24 cursor-pointer rounded-md"
            onClick={() => handleSelectBg('', blurOption.mode)}
          />
        </div>
        {backgrounds.map((background, index) => (
          <div
            key={index}
            className={`p-2 ${
              selectedBg === background ? 'border-4 border-indigo-500/75' : ''
            }`}
          >
            <img
              src={background}
              alt={`Background ${index}`}
              className="w-24 h-24 cursor-pointer rounded-md"
              onClick={() => handleSelectBg(background)}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between w-full p-4 bg-gray-100 border-t border-gray-300">
        <button
          className="mr-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={handleApplyBg}
          disabled={!selectedBg && bgMode !== 'blur'}
        >
          Apply
        </button>
        <button
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          onClick={handleRemoveBg}
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default VirtualBackgroundSelector;
