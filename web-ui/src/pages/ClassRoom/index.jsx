import React from 'react';

const ClassroomApp = () => {
    return (
      <div className="flex flex-col h-screen">
         <div className="flex flex-wrap items-stretch h-100 overflow-hidden w-3/4 p-4">
          <VideoParticipant name="Me" />
          <VideoParticipant name="Mike" />
          <VideoParticipant name="Sue" />
          <VideoParticipant name="Mel" />
        </div>
        <div className="flex-1 w-3/4 p-4">
          <MainTeacher />
        </div>
        <div className="h-12 bg-gray-200 w-3/4 p-4">
          <VideoControls />
        </div>
  
       
  
        <div className="w-1/4 h-screen fixed top-0 right-0 p-4 overflow-y-auto bg-white">
          <ChatWindow />
        </div>
      </div>
    );
  };
  
  const MainTeacher = () => {
    return (
      <div className="h-full">
        <div className="bg-black h-full"></div>
      </div>
    );
  };
  
  const VideoControls = () => {
    return (
      <div className="flex justify-between items-center px-4 h-full">
        <button className="text-xs bg-gray-300 p-2 rounded-full mx-1">Mute</button>
        <button className="text-xs bg-gray-300 p-2 rounded-full mx-1">Video</button>
        <button className="text-xs bg-gray-300 p-2 rounded-full mx-1">Share</button>
   
      </div>
    );
  };
  
  const VideoParticipant = ({ name }) => {
    return (
      <div className="flex-1 max-w-1/6 h-full p-2">
        <div className="flex flex-col h-full bg-white rounded-lg shadow">
          <div className="flex-1 bg-black"> {/* Video feed placeholder */}</div>
          <div className="p-2 text-center">
            {name}
          </div>
        </div>
      </div>
    );
  };
  

const ChatWindow = () => {
  return (
    <div>
      <div className="overflow-y-auto h-48 mb-4">
        <ChatMessage message="How did you get the root(3) on the right side of the equation?" />
      </div>
      <div className="flex">
        <input
          className="border p-2 rounded-l-lg flex-1"
          placeholder="Say something..."
        />
        <button className="bg-blue-500 text-white p-2 rounded-r-lg">
          Send
        </button>
      </div>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  return (
    <div className="p-2 border-b">
      <span>{message}</span>
    </div>
  );
};

export default ClassroomApp;