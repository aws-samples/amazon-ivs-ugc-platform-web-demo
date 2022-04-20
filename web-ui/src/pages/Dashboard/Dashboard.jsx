import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChevronRight, ChevronLeft, Settings } from '../../assets/icons';
import { dashboard as $content } from '../../content';
import { useNotif } from '../../contexts/Notification';
import { userManagement } from '../../api';
import { useUser } from '../../contexts/User';
import Button from '../../components/Button';
import Notification from '../../components/Notification';
import './Dashboard.css';

const Dashboard = () => {
  const [isCreatingResources, setIsCreatingResources] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState();

  const { userData, updateUserData } = useUser();
  const { notifyError } = useNotif();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { error: sessionError } = await userManagement.getCurrentSession();

      if (sessionError) {
        navigate('/login');
      } else {
        setIsSessionValid(true);
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    const initUser = async () => {
      if (userData) return;

      setIsCreatingResources(true);
      const { result, error } = await userManagement.createResources();

      if (result) updateUserData(result);

      if (error) notifyError($content.account_setup_error);

      setIsCreatingResources(false);
    };

    if (isSessionValid) {
      initUser();
    }
  }, [isSessionValid, notifyError, updateUserData, userData]);

  return (
    <div>
      <section className="nav-bar">
        <div className="session-navigator">
          <Button className="nav-button" variant="secondary">
            <ChevronLeft className="nav-icon" />
          </Button>
          <Button className="session-button" variant="secondary">
            <div className="date-time-container">
              <div className="date">Mon March 7, 2022</div>
              <div className="time">12:30PM PST – 11:59PM PST</div>
            </div>
          </Button>
          <Button className="nav-button" variant="secondary">
            <ChevronRight className="nav-icon" />
          </Button>
        </div>
        <div className="buttons">
          <Button className="settings-button" variant="secondary">
            <Settings />
          </Button>
          <Button variant="secondary">Log out</Button>
        </div>
      </section>
      <Notification />
      {isCreatingResources ? (
        <p>Creating Resources...</p>
      ) : (
        <section className="temp-dashboard-section">
          <h1>Stream Health Dashboard</h1>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
