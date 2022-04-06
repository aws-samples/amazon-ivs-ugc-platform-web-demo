import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const isSignedIn = false;

  useEffect(() => !isSignedIn && navigate('/login'), [isSignedIn, navigate]);

  return <div>Dashboard</div>;
};

export default Dashboard;
