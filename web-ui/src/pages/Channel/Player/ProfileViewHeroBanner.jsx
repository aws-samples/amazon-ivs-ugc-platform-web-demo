import { motion } from 'framer-motion';

import { clsm } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';

const heroBannerLinearGradients = {
  dark: `
    linear-gradient(
      0deg,
      hsla(var(--base-color-white), 0%, 1) 0%,
      hsla(var(--base-color-white), 0%, 0.3) 100%
    )
  `,
  light: {
    collapsed: `
      linear-gradient(
        0deg, 
        hsla(var(--base-color-white), 80%, 1) 0%,
        hsla(var(--base-color-white), 80%, 0.95) 39.58%,
        hsla(var(--base-color-white), 80%, 0.3) 100%
      )
    `,
    expanded: `
      linear-gradient(
        0deg, 
        hsla(var(--base-color-white), 100%, 1) 0%,
        hsla(var(--base-color-white), 100%, 0.95) 39.58%,
        hsla(var(--base-color-white), 100%, 0.3) 100%
      )
    `
  }
};

const ProfileViewHeroBanner = () => {
  const {
    getProfileViewAnimationProps,
    headerAnimationControls,
    isProfileViewExpanded,
    shouldAnimateProfileView
  } = useProfileViewAnimation();
  const { isMobileView, isLandscape } = useResponsiveDevice();
  const { channelData } = useChannel();
  const bannerSrc = channelData?.channelAssetUrls?.banner || '';

  return (
    <motion.div
      {...getProfileViewAnimationProps(headerAnimationControls, {
        expanded: { y: 0 },
        collapsed: { y: '-100%' }
      })}
      style={{
        '--heroBannerSrc': `url(${bannerSrc})`,
        '--darkHeroBannerGradient': heroBannerLinearGradients.dark,
        '--lightHeroBannerGradientCollapsed':
          heroBannerLinearGradients.light.collapsed,
        '--lightHeroBannerGradientExpanded':
          heroBannerLinearGradients.light.expanded
      }}
      className={clsm([
        'before:absolute',
        'before:top-0',
        'before:left-0',
        'before:w-full',
        'before:h-full',
        'before:duration-[400ms]',
        'before:transition-opacity',
        "before:content-['']",
        'before:dark:bg-[image:var(--darkHeroBannerGradient)]',
        'before:bg-[image:var(--lightHeroBannerGradientCollapsed)]',
        isProfileViewExpanded ? 'before:opacity-0' : 'before:opacity-100',
        shouldAnimateProfileView.current
          ? 'before:duration-[400ms]'
          : 'before:duration-0',
        'absolute',
        'top-0',
        'left-0',
        'w-full',
        'bg-top',
        'bg-cover',
        'bg-no-repeat',
        'bg-[image:var(--lightHeroBannerGradientExpanded),var(--heroBannerSrc)]',
        'dark:bg-[image:var(--darkHeroBannerGradient),var(--heroBannerSrc)]',
        '-z-20',
        isMobileView && isLandscape ? 'h-3/4' : 'h-1/2'
      ])}
    />
  );
};

export default ProfileViewHeroBanner;
