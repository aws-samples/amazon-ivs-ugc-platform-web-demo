import { m } from 'framer-motion';
import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm, noop } from '../../../../utils';
import { createAnimationProps } from '../../../../utils/animationPropsHelper';
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

const ImageUploader = ({
  assetType,
  className,
  uploadUrl,
  onDelete,
  onUpload
}) => {
  const maximumFileSize = MAXIMUM_IMAGE_FILE_SIZE[assetType];
  const {
    deleteChannelAsset,
    isDeleting,
    isUploading,
    previewUrl,
    uploadChannelAsset
  } = useImageUpload({
    assetType,
    onDelete,
    onUpload,
    maximumFileSize
  });
  const { openModal } = useModal();
  const fileInputRef = useRef();
  const deleteButtonRef = useRef();
  const hasUpload = previewUrl || uploadUrl;
  const acceptedImageFileFormats = SUPPORTED_IMAGE_FILE_FORMATS.flat()
    .map((fileFormat) => `.${fileFormat}`)
    .join(',');

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
            'absolute',
            'flex',
            'items-center',
            'justify-center',
            'w-full',
            'h-full',
            'bg-white',
            'dark:bg-black'
          ])}
        >
          <Spinner className="absolute" variant="light" size="xlarge" />
        </div>
      );
    } else if (hasUpload) {
      return (
        <img
          alt={`${assetType} upload preview`}
          draggable={false}
          src={previewUrl || uploadUrl}
        />
      );
    } else {
      return <NoImageSrcIcon />;
    }
  }, [assetType, hasUpload, isUploading, previewUrl, uploadUrl]);

  return (
    <m.div
      {...createAnimationProps({
        animations: ['fadeIn-full'],
        transition: 'bounce',
        customVariants: {
          hidden: { height: 0 },
          visible: { height: 'auto' }
        }
      })}
      className="overflow-hidden"
    >
      <div className={clsm(['flex', 'items-center', 'space-x-6', className])}>
        <div
          className={clsm([
            'relative',
            'flex',
            'items-center',
            'justify-center',
            'w-[124px]',
            'h-[124px]',
            'rounded-full',
            'overflow-hidden'
          ])}
        >
          {renderPreview()}
        </div>
        <div className="space-y-4">
          <div className={clsm(['flex', 'space-x-3'])}>
            <Button
              className={clsm([
                'px-4',
                'focus:bg-lightMode-gray-light-hover',
                'hover:bg-lightMode-gray-light-hover',
                'dark:focus:bg-darkMode-gray-hover',
                'dark:hover:bg-darkMode-gray-hover'
              ])}
              onClick={() => fileInputRef.current.click()}
              variant="secondary"
            >
              <Upload className={clsm(['w-6', 'h-6', 'mr-2'])} />
              {hasUpload
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
              isDisabled={!hasUpload}
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
};

ImageUploader.propTypes = {
  assetType: PropTypes.string.isRequired,
  className: PropTypes.string,
  onDelete: PropTypes.func,
  onUpload: PropTypes.func,
  uploadUrl: PropTypes.string
};

ImageUploader.defaultProps = {
  className: '',
  onDelete: noop,
  onUpload: noop,
  uploadUrl: ''
};

export default ImageUploader;
