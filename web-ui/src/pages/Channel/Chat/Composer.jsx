import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE } from './utils';
import { clsm } from '../../../utils';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import FloatingNav from '../../../components/FloatingNav';

const $content = $channelContent.chat;

const Composer = ({ chatUserRole, isDisabled, sendMessage }) => {
  const navigate = useNavigate();
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid } = useUser();
  const canSendMessages =
    chatUserRole &&
    [CHAT_USER_ROLE.SENDER, CHAT_USER_ROLE.MODERATOR].includes(chatUserRole);

  const handleSendMessage = () => {
    if (!canSendMessages) navigate('/login');

    sendMessage('Hello, IVS Chat! 👋 Welcome to my livestream');
  };

  return (
    <div className={clsm(['w-full', 'pt-5', 'pb-6', 'px-[18px]', 'z-50'])}>
      <Button
        className={clsm(
          ['w-full', 'h-12'],
          isSessionValid && [
            'md:w-[calc(100%_-_60px)]',
            'touch-screen-device:lg:landscape:w-[calc(100%_-_60px)]'
          ]
        )}
        isDisabled={isDisabled}
        onClick={handleSendMessage}
        variant="secondary"
      >
        {$content.say_something}
      </Button>
      {isMobileView && <FloatingNav />}
    </div>
  );
};

Composer.defaultProps = {
  chatUserRole: undefined,
  isDisabled: false
};

Composer.propTypes = {
  chatUserRole: PropTypes.oneOf(Object.values(CHAT_USER_ROLE)),
  isDisabled: PropTypes.bool,
  sendMessage: PropTypes.func.isRequired
};

export default Composer;
