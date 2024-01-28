import React, { useContext, useEffect, useRef, useState } from 'react';
import { StageContext } from '../contexts/StageContext.js';
import { MicOff, MicOn, VideoCamera, VideoCameraOff } from '../../../assets/icons/index.js';
import { useChat } from '../../../contexts/Chat.jsx';
import { useUser } from '../../../contexts/User.jsx';
const ParticipantList = () => {
//   const [participants, setParticipants] = useState([
//     { id: 1, name: 'Participant 1', isMicOn: true, isVideoOn: true },
//     { id: 2, name: 'Participant 2', isMicOn: false, isVideoOn: true },
//     { id: 3, name: 'Participant 3', isMicOn: true, isVideoOn: false },
//     // Add more participants as needed
//   ]);
    const [filteredChatParticipants, setFilteredChatParticipants] = useState([])
    const { participants } = useContext(StageContext);
    const { userData } = useUser();
    const { participantList } = useChat();
    const stageParticipants = Array.from(participants, ([name, value]) => ({ name, value }));
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const filteredStageParticipants = stageParticipants?.filter((participant) =>
    participant?.value?.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const stageUserIds = stageParticipants.map(p => p?.value?.userId)
  const tempParticipantList = participantList?.filter(p => !stageUserIds.includes(p) && p !== userData.username)
// console.log("participantList", participantList);
  const removeDuplicates = (arr) => {
    return [...new Set(arr)];
  }
  // const filteredChatParticipants = tempParticipantList?.filter((participant) =>
  //   participant.toLowerCase().includes(searchTerm.toLowerCase()) && participant != ""
  // );
  // useEffect(() => {
  //   const chatParticipants = tempParticipantList?.filter((participant) =>
  //     participant.toLowerCase().includes(searchTerm.toLowerCase()) && participant !== ""
  //   );
  //   const list = removeDuplicates(chatParticipants)
  //   setFilteredChatParticipants(list)
  // }, [participants, searchTerm])

  
  useEffect(() => {
    const chatParticipants = tempParticipantList?.filter((participant) =>
      participant.toLowerCase().includes(searchTerm.toLowerCase()) && participant !== ""
    );
    const list = removeDuplicates(chatParticipants)
    setFilteredChatParticipants(list)
  }, [participantList, searchTerm])
    
  
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  return (
    <div className=''>
        {/* <div className="flex items-center mb-4">
            <button onClick={handleToggleCollapse} className="mr-2">
            {isCollapsed ? '🔽' : '🔼'}
            </button>
            
        </div> */}
        {!isCollapsed &&<div className='text-right text-gray-600 font-medium'>
        <input
            type="text"
            placeholder="Search participants"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="m-2 p-1 border border-black w-11/12 rounded self-center"
        />
        <div className="space-y-4">
          {filteredStageParticipants?.length > 0 && <span className="flex self-center pl-3">Stage</span>}
            {filteredStageParticipants?.map((participant) => (
            <div key={participant.name} className="flex items-center space-x-2 pl-5 font-bold text-blue-700">
                <span className="mr-2">{participant?.value?.userId}</span>
                <span >
                {participant?.value?.audioMuted ? <MicOn style={{ height: 15 }} /> : <MicOff style={{ height: 15 }} />}
                </span>
                <span>{participant?.value?.isPublishing ? <VideoCamera style={{ height: 15 }} /> : <VideoCameraOff style={{ height: 15 }} />}</span>
            </div>
            ))}
        <hr
            style={{ borderTop: "1px solid lightgrey" }}
        />
            {filteredChatParticipants?.length > 0 && <span className="flex self-center pl-3">Other Participants</span>}
            {/* <hr
            style={{ borderTop: "1px solid lightgrey" }}
            className='w-5/6 ml-2'
            /> */}
            {filteredChatParticipants?.map((participant) => (
            <div key={participant} className="flex items-center space-x-2 pl-5">
                <span className="ml-2">{participant}</span>
            </div>
            ))}
        </div>
        </div>}
    </div>
    
  );
};

export default ParticipantList;
