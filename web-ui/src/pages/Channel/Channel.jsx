import { useParams } from 'react-router-dom';
import './Channel.css';

const Channel = () => {
  const { username } = useParams();

  return (
    <div className="main-channel-container">
      <h1>{username}'s Channel Page</h1>
    </div>
  );
};

export default Channel;
