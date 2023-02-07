import { useCallback, useEffect, useState } from 'react';

import { bound, clsm, range } from '../../utils';
import { BREAKPOINTS, MAX_AVATAR_COUNT } from '../../constants';
import { channelDirectory as $channelDirectoryContent } from '../../content';
import { ChevronLeft, ChevronRight } from '../../assets/icons';
import { getAvatarSrc } from '../../helpers';
import { useNotif } from '../../contexts/Notification';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import Button from '../../components/Button';
import DataUnavailable from './DataUnavailable';
import FollowedUserButton from './FollowedUserButton';
import Spinner from '../../components/Spinner';
import usePrevious from '../../hooks/usePrevious';
import ViewAllButton from './ViewAllButton';
import { useUser } from '../../contexts/User';

const $content = $channelDirectoryContent.following_section;
const $channelDirectoryNotifications = $channelDirectoryContent.notification;

const CAROUSEL_BUTTON_CLASSES = [
  'bg-lightMode-gray-extraLight',
  'h-auto',
  'min-w-[auto]',
  'p-1.5'
];

const SECTION_MIN_HEIGHT_CLASSES = [
  'min-h-[204px]',
  'md:min-h-[174px]',
  'sm:min-h-[146px]'
];

const SECTION_CENTERED_CONTENT_BASE_CLASSES = [
  'flex-col',
  'flex',
  'grow',
  'h-auto',
  'items-center',
  'justify-center',
  'left-0',
  'h-full',
  'relative',
  'static',
  'top-0',
  'w-full',
  SECTION_MIN_HEIGHT_CLASSES
];

const isPreviousFrame = (frameIndex, currentFrameIndex) =>
  frameIndex === currentFrameIndex - 1;
const isNextFrame = (frameIndex, currentFrameIndex) =>
  frameIndex === currentFrameIndex + 1;

const FollowingSection = () => {
  const {
    fetchUserFollowingList: tryAgainFn,
    hasErrorFetchingFollowingList: hasFetchError,
    isSessionValid,
    userData
  } = useUser();
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const { currentBreakpoint, isMobileView } = useResponsiveDevice();
  const { followingList } = userData || {};
  const { notifyError } = useNotif();
  const hasFollowingListData = !!followingList?.length;
  const isLoading = followingList === undefined && !hasFetchError;
  const prevBreakpoint = usePrevious(currentBreakpoint);
  const shouldShowFollowingListData = !isLoading && hasFollowingListData;
  const shouldShowTryAgainButton = hasFetchError && !isMobileView;
  const shouldShowViewAllButton = followingList?.length > MAX_AVATAR_COUNT;
  let sectionList = followingList;

  if (shouldShowViewAllButton)
    sectionList = followingList?.slice(0, MAX_AVATAR_COUNT);

  // Carousel parameters - START
  let avatarsPerFrame = 5;

  if (currentBreakpoint < BREAKPOINTS.lg) avatarsPerFrame = 4;
  if (currentBreakpoint < BREAKPOINTS.sm) avatarsPerFrame = 3;
  if (currentBreakpoint === BREAKPOINTS.xxs) avatarsPerFrame = 2;

  const carouselFramesCount = Math.ceil(sectionList?.length / avatarsPerFrame);

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

  useEffect(() => {
    if (hasFetchError)
      notifyError($channelDirectoryNotifications.error.error_loading_channels);
  }, [hasFetchError, notifyError]);

  /**
   * If the user is not logged hide the following summary section.
   */
  if (!isSessionValid) return null;

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
      <div className={clsm(['flex', 'justify-between', 'h-[48px]'])}>
        <h2 className={clsm(['text-black', 'dark:text-white'])}>
          {$content.title}
        </h2>
        {shouldShowFollowingListData && (
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
        )}
      </div>
      {shouldShowFollowingListData && (
        <div className={clsm(['flex', 'h-full', 'relative'])}>
          {range(carouselFramesCount).map((frameIndex) => {
            const leftMostAvatarIndex = frameIndex * avatarsPerFrame;
            const rightMostAvatarIndex = leftMostAvatarIndex + avatarsPerFrame;
            let translateOffset = 0;

            if (isPreviousFrame(frameIndex, selectedFrameIndex))
              translateOffset = -32;
            if (isNextFrame(frameIndex, selectedFrameIndex))
              translateOffset = 32;
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
                  'xs:grid-cols-2',
                  SECTION_MIN_HEIGHT_CLASSES
                ])}
                key={`carousel-frame-${frameIndex}`}
                style={{
                  transform: `translateX(calc(${translateOffset}px + ${
                    (frameIndex - selectedFrameIndex) * 100
                  }%))`
                }}
              >
                {sectionList
                  .slice(leftMostAvatarIndex, rightMostAvatarIndex)
                  .map((channelData) => {
                    const { color, username, isLive } = channelData;

                    return (
                      <FollowedUserButton
                        avatarSrc={getAvatarSrc(channelData)}
                        color={color}
                        isLive={isLive}
                        key={username}
                        username={username}
                      />
                    );
                  })}
                {frameIndex === carouselFramesCount - 1 &&
                  !hasFetchError &&
                  shouldShowViewAllButton && <ViewAllButton />}
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && !hasFollowingListData && (
        <DataUnavailable
          className={clsm([
            SECTION_CENTERED_CONTENT_BASE_CLASSES,
            'space-y-8',
            'text-center'
          ])}
          noDataText={
            hasFetchError
              ? $content.failed_to_load_channels
              : $content.no_channels_followed
          }
          hasError={shouldShowTryAgainButton}
          tryAgainFn={tryAgainFn}
          tryAgainText={$content.try_again}
        />
      )}
      {isLoading && (
        <div
          className={clsm([
            SECTION_CENTERED_CONTENT_BASE_CLASSES,
            SECTION_MIN_HEIGHT_CLASSES,
            'space-y-8'
          ])}
        >
          <Spinner size="large" variant="light" />
        </div>
      )}
    </section>
  );
};

export default FollowingSection;
