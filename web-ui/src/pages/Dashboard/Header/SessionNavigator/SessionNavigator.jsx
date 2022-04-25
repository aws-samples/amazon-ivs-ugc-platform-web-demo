import { useLocation, useNavigate } from 'react-router-dom';

import { ChevronLeft, ChevronRight } from '../../../../assets/icons';
import { dashboard as $content } from '../../../../content';
import Button from '../../../../components/Button';
import './SessionNavigator.css';

const SessionNavigator = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isNavDisabled = pathname !== '/';

  const handleSessionNavigator = () => {
    if (pathname !== '/') {
      navigate(-1);
    }
  };

  const handleNextStream = () => {
    console.log('Go to next stream');
  };

  const handlePreviousStream = () => {
    console.log('Go to previous stream');
  };

  return (
    <div className="session-navigator">
      <Button
        className="nav-button"
        isDisabled={isNavDisabled}
        onClick={handlePreviousStream}
        variant="secondary"
      >
        <ChevronLeft />
      </Button>
      <Button
        onClick={handleSessionNavigator}
        className="session-list"
        variant="secondary"
      >
        {!isNavDisabled ? (
          <span className="date-time-container">
            <p className="date">Stream Session</p>
            <p className="time">Select a stream session to view</p>
          </span>
        ) : (
          <p>{$content.header.return_to_session}</p>
        )}
      </Button>
      <Button
        className="nav-button"
        isDisabled={isNavDisabled}
        onClick={handleNextStream}
        variant="secondary"
      >
        <ChevronRight />
      </Button>
    </div>
  );
};

export default SessionNavigator;
