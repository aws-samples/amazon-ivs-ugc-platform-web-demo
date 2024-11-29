import PropTypes from 'prop-types';
import { clsm } from '../../../../../utils';
import UserAvatar from '../../../../../components/UserAvatar';

const ParticipantOverflowCard = ({
  avatars,
  additionalCount = 0,
  isMinified = false
}) => {
  const totalOverflowParticipants = avatars.length + additionalCount;

  return (
    <div
      className={clsm([
        '@container/overflow-card',
        'bg-darkMode-gray-medium',
        'flex-1',
        'flex',
        'items-center',
        'justify-center',
        'rounded-xl',
        'w-full'
      ])}
    >
      {!isMinified &&
        avatars?.map((avatarSrc, index) => (
          <div
            key={`${avatarSrc}-${index}`}
            className={clsm([
              index > 0 && '-ml-3',
              additionalCount > 0 && ['hidden', '@[140px]/overflow-card:block']
            ])}
          >
            <UserAvatar avatarSrc={avatarSrc} />
          </div>
        ))}
      {(isMinified || additionalCount > 0) && (
        <div
          className={clsm([
            '@[140px]/overflow-card:-ml-3',
            '@[46px]/overflow-card:w-6',
            '@[46px]/overflow-card:h-6',
            'bg-lightMode-gray-extraLight',
            'dark:bg-darkMode-gray',
            'dark:ring-white',
            'flex',
            'h-7',
            'items-center',
            'justify-center',
            'ring-2',
            'ring-black',
            'rounded-[50%]',
            'w-7'
          ])}
        >
          <h3
            className={clsm([
              'hidden',
              '@[140px]/overflow-card:block',
              '@[46px]/overflow-card:text-[0.75rem]',
              'text-[16px]'
            ])}
          >
            +{additionalCount}
          </h3>
          <h3
            className={clsm([
              'block',
              '@[140px]/overflow-card:hidden',
              '@[46px]/overflow-card:text-[0.75rem]',
              'text-[16px]'
            ])}
          >
            +{totalOverflowParticipants}
          </h3>
        </div>
      )}
    </div>
  );
};

ParticipantOverflowCard.propTypes = {
  avatars: PropTypes.array.isRequired,
  additionalCount: PropTypes.number,
  isMinified: PropTypes.bool
};

export default ParticipantOverflowCard;
