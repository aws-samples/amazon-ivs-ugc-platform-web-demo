import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm, noop } from '../../../../utils';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { dashboard as $content } from '../../../../content';
import { Delete, Upload } from '../../../../assets/icons';
import {
  MAXIMUM_IMAGE_FILE_SIZE,
  SUPPORTED_IMAGE_FILE_FORMATS
} from '../../../../constants';
import { useModal } from '../../../../contexts/Modal';
import Button from '../../../../components/Button';
import NoImageSrcIcon from '../../../../components/IconSelect/NoImageSrcIcon';
import Spinner from '../../../../components/Spinner';
import useImageUpload from '../../../../hooks/useImageUpload';

const $channelAssetModalContent = $content.modal.channel_asset_deletion_modal;
const STACKING_BREAKPOINT = 910; // px
const isStackingBreakpoint = () => window.innerWidth < STACKING_BREAKPOINT;

const ImageUploader = forwardRef(
  (
    {
      assetType,
      className,
      onDelete,
      onUpload,
      shouldAnimate,
      uploadUrl,
      previewShape
    },
    containerRef
  ) => {
    const maximumFileSize = MAXIMUM_IMAGE_FILE_SIZE[assetType];
    const {
      deleteChannelAsset,
      isDeleting,
      isUploading,
      previewUrl,
      uploadChannelAsset
    } = useImageUpload({ assetType, onDelete, onUpload, maximumFileSize });
    const { openModal } = useModal();
    const [shouldStack, setShouldStack] = useState(isStackingBreakpoint());
    const fileInputRef = useRef();
    const deleteButtonRef = useRef();
    const hasUploadUrl = !!(previewUrl || uploadUrl);
    const acceptedImageFileFormats = SUPPORTED_IMAGE_FILE_FORMATS.flat()
      .map((fileFormat) => `.${fileFormat}`)
      .join(',');
    const previewClasses = useMemo(() => {
      const classes = [
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray',
        'w-auto',
        shouldStack ? 'h-full' : `h-[124px]`
      ];

      if (previewShape === 'round')
        return classes.concat(['aspect-square', 'rounded-full']);

      if (previewShape === '16/9')
        return classes.concat(['aspect-video', 'rounded-xl']);
    }, [previewShape, shouldStack]);

    const handleUpload = async (e) => {
      await uploadChannelAsset(e);
      e.target.value = '';
    };

    const handleDelete = () => {
      const confirmText = $channelAssetModalContent.delete_image;
      const message = $channelAssetModalContent.confirm_intent_message.replace(
        '{ASSET_TYPE}',
        assetType
      );

      openModal({
        content: { confirmText, message, isDestructive: true },
        onConfirm: deleteChannelAsset,
        lastFocusedElement: deleteButtonRef
      });
    };

    const renderPreview = useCallback(() => {
      if (isUploading) {
        return (
          <div
            className={clsm([
              'flex',
              'items-center',
              'justify-center',
              'bg-white',
              'dark:bg-black',
              previewClasses
            ])}
          >
            <Spinner variant="light" size="xlarge" />
          </div>
        );
      } else if (hasUploadUrl) {
        return (
          <img
            className={clsm(previewClasses)}
            alt={`${assetType} upload preview`}
            draggable={false}
            src={previewUrl || uploadUrl}
          />
        );
      } else {
        return (
          <NoImageSrcIcon className={previewClasses} shape={previewShape} />
        );
      }
    }, [
      assetType,
      hasUploadUrl,
      previewClasses,
      isUploading,
      previewShape,
      previewUrl,
      uploadUrl
    ]);

    useLayoutEffect(() => {
      const { orientation } = window.screen;
      const onDimensionsChange = () => setShouldStack(isStackingBreakpoint());

      window.addEventListener('resize', onDimensionsChange);
      window.addEventListener('orientationchange', onDimensionsChange);
      orientation?.addEventListener('change', onDimensionsChange);

      return () => {
        window.removeEventListener('resize', onDimensionsChange);
        window.removeEventListener('orientationchange', onDimensionsChange);
        orientation?.removeEventListener('change', onDimensionsChange);
      };
    }, []);

    return (
      <m.div
        {...(shouldAnimate &&
          createAnimationProps({
            animations: ['fadeIn-full'],
            transition: 'bounce',
            customVariants: {
              hidden: { height: 0 },
              visible: { height: 'auto' }
            }
          }))}
        className="overflow-hidden"
        ref={containerRef}
      >
        <div
          className={clsm([
            'flex',
            'items-center',
            'space-x-6',
            shouldStack && ['flex-col', 'space-y-5', 'space-x-0'],
            className
          ])}
        >
          <div
            className={clsm([
              'relative',
              'flex',
              'items-center',
              'justify-center',
              'overflow-hidden',
              shouldStack && ['w-full', 'h-full', 'aspect-video']
            ])}
          >
            {renderPreview()}
          </div>
          <div
            className={clsm([
              'space-y-4',
              shouldStack && ['w-full', 'text-center']
            ])}
          >
            <div className={clsm(['flex', 'space-x-3'])}>
              <Button
                className={clsm([
                  'px-4',
                  'w-full',
                  'focus:bg-lightMode-gray-light-hover',
                  'hover:bg-lightMode-gray-light-hover',
                  'dark:focus:bg-darkMode-gray-hover',
                  'dark:hover:bg-darkMode-gray-hover'
                ])}
                onClick={() => fileInputRef.current.click()}
                variant="secondary"
              >
                <Upload className={clsm(['w-6', 'h-6', 'mr-2'])} />
                {hasUploadUrl
                  ? $content.settings_page.replace_image
                  : $content.settings_page.upload_image}
              </Button>
              <input
                accept={acceptedImageFileFormats}
                className="hidden"
                onChange={handleUpload}
                ref={fileInputRef}
                type="file"
              />
              <Button
                variant="icon"
                isDisabled={!hasUploadUrl}
                ref={deleteButtonRef}
                onClick={handleDelete}
                className={clsm([
                  'h-11',
                  'w-11',
                  'bg-white',
                  '[&>svg]:h-6',
                  '[&>svg]:w-6',
                  '[&>svg]:fill-black',
                  'dark:[&>svg]:fill-white',
                  'dark:bg-darkMode-gray'
                ])}
                ariaLabel={`delete ${assetType} image`}
              >
                {isDeleting ? <Spinner /> : <Delete />}
              </Button>
            </div>
            <p
              className={clsm([
                'text-[13px]',
                'font-medium',
                'leading-[15.73px]',
                'text-lightMode-gray-medium',
                'dark:text-darkMode-gray-light'
              ])}
            >
              {$content.settings_page.upload_restrictions
                .replace(
                  '{FILE_FORMATS}',
                  SUPPORTED_IMAGE_FILE_FORMATS.map((fileFormat) =>
                    (typeof fileFormat === 'string'
                      ? fileFormat
                      : fileFormat[0]
                    ).toUpperCase()
                  ).join(', ')
                )
                .replace('{MAXIMUM_FILE_SIZE}', maximumFileSize)}
            </p>
          </div>
        </div>
      </m.div>
    );
  }
);

ImageUploader.propTypes = {
  assetType: PropTypes.string.isRequired,
  className: PropTypes.string,
  onDelete: PropTypes.func,
  onUpload: PropTypes.func,
  previewShape: PropTypes.oneOf(['round', '16/9']),
  shouldAnimate: PropTypes.bool,
  uploadUrl: PropTypes.string
};

ImageUploader.defaultProps = {
  className: '',
  onDelete: noop,
  onUpload: noop,
  previewShape: 'round',
  shouldAnimate: true,
  uploadUrl: ''
};

export default ImageUploader;
