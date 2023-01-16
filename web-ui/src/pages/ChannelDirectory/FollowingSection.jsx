import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { bound, clsm, range } from '../../utils';
import { BREAKPOINTS } from '../../constants';
import { channelDirectory as $channelDirectoryContent } from '../../content';
import { ChevronLeft, ChevronRight } from '../../assets/icons';
import { getAvatarSrc } from '../../helpers';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import Button from '../../components/Button';
import FollowedUserButton from './FollowedUserButton';
import usePrevious from '../../hooks/usePrevious';

const $content = $channelDirectoryContent.following_section;

const CAROUSEL_BUTTON_CLASSES = [
  'bg-lightMode-gray-extraLight',
  'h-auto',
  'min-w-[auto]',
  'p-1.5'
];

const isPreviousFrame = (frameIndex, currentFrameIndex) =>
  frameIndex === currentFrameIndex - 1;
const isNextFrame = (frameIndex, currentFrameIndex) =>
  frameIndex === currentFrameIndex + 1;

// TEMP
const MOCK_USER_COUNT = 12;
const MOCK_USER_DATA = {
  avatarSrc: getAvatarSrc({ avatar: 'bear' }),
  color: 'green',
  username: 'RealGamer'
};

const FollowingSection = ({ hasFollowingChannels }) => {
  const { currentBreakpoint } = useResponsiveDevice();
  const { avatarSrc, color, username } = MOCK_USER_DATA;
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const prevBreakpoint = usePrevious(currentBreakpoint);

  // Carousel parameters - START
  let avatarsPerFrame = 5;

  if (currentBreakpoint < BREAKPOINTS.lg) avatarsPerFrame = 4;
  if (currentBreakpoint < BREAKPOINTS.sm) avatarsPerFrame = 3;
  if (currentBreakpoint === BREAKPOINTS.xxs) avatarsPerFrame = 2;

  const carouselFramesCount = Math.ceil(MOCK_USER_COUNT / avatarsPerFrame);
  const prevLeftMostAvatarIndex = usePrevious(
    selectedFrameIndex * avatarsPerFrame
  );
  // Carousel parameters - END

  const prevButtonHandler = useCallback(() => {
    setSelectedFrameIndex((prev) => bound(prev - 1, 0));
  }, []);
  const nextButtonHandler = useCallback(() => {
    setSelectedFrameIndex((prev) =>
      bound(prev + 1, 0, carouselFramesCount - 1)
    );
  }, [carouselFramesCount]);

  /**
   * The following effect ensures that, after a viewport resizing occurs,
   * the new selected frame index is set based on the previously selected frame index
   */
  useEffect(() => {
    if (
      prevBreakpoint !== currentBreakpoint &&
      typeof prevLeftMostAvatarIndex === 'number'
    )
      setSelectedFrameIndex(
        Math.floor(prevLeftMostAvatarIndex / avatarsPerFrame)
      );
  }, [
    avatarsPerFrame,
    currentBreakpoint,
    prevBreakpoint,
    prevLeftMostAvatarIndex
  ]);

  if (!hasFollowingChannels || !carouselFramesCount) return null;

  return (
    <section
      className={clsm([
        'flex-col',
        'flex',
        'max-w-[960px]',
        'mb-[72px]',
        'overflow-x-hidden',
        'px-4',
        'shrink-0',
        'space-y-8',
        'w-[calc(100%_+_32px)]'
      ])}
    >
      <div className={clsm(['flex', 'justify-between'])}>
        <h2 className={clsm(['text-black', 'dark:text-white'])}>
          {$content.title}
        </h2>
        <div className={clsm(['flex', 'gap-x-3'])}>
          <Button
            className={clsm(CAROUSEL_BUTTON_CLASSES)}
            isDisabled={selectedFrameIndex === 0}
            onClick={prevButtonHandler}
            variant="secondary"
            ariaLabel="Go to previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            className={clsm(CAROUSEL_BUTTON_CLASSES)}
            isDisabled={selectedFrameIndex === carouselFramesCount - 1}
            onClick={nextButtonHandler}
            variant="secondary"
            ariaLabel="Go to next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className={clsm(['flex', 'h-full', 'relative'])}>
        {range(carouselFramesCount).map((frameIndex) => {
          let translateOffset = 0;

          if (isPreviousFrame(frameIndex, selectedFrameIndex))
            translateOffset = -32;
          if (isNextFrame(frameIndex, selectedFrameIndex)) translateOffset = 32;

          return (
            <div
              className={clsm([
                frameIndex !== 0 && 'absolute', // The first frame is used to set the height
                'gap-x-8',
                'grid-cols-5',
                'grid',
                'left-0',
                'lg:grid-cols-4',
                'sm:grid-cols-3',
                'top-0',
                'transition-transform',
                'w-full',
                'xs:grid-cols-2'
              ])}
              key={`carousel-frame-${frameIndex}`}
              style={{
                transform: `translateX(calc(${translateOffset}px + ${
                  (frameIndex - selectedFrameIndex) * 100
                }%))`
              }}
            >
              {range(MOCK_USER_COUNT)
                .splice(frameIndex * avatarsPerFrame, avatarsPerFrame)
                .map((avatarIndex) => (
                  <FollowedUserButton
                    avatarSrc={avatarSrc}
                    color={color}
                    isLive={
                      avatarIndex < 0.2 * MOCK_USER_COUNT // TEMP
                    }
                    key={`avatar-${avatarIndex}`}
                    username={`${username}${
                      avatarIndex // TEMP
                    }`}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
};

FollowingSection.propTypes = {
  hasFollowingChannels: PropTypes.bool.isRequired
};

export default FollowingSection;
