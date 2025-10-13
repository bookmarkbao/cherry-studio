import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  Progress,
  Spinner,
  useDisclosure
} from '@heroui/react'
import { Video } from '@renderer/types/video'
import { CheckCircleIcon, CircleXIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface VideoViewerProps {
  video?: Video
}

export const VideoViewer = ({ video }: VideoViewerProps) => {
  const { t } = useTranslation()
  const [loadSuccess, setLoadSuccess] = useState<boolean | undefined>(undefined)
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-foreground-200">
        {video === undefined && t('video.undefined')}
        {video && video.status === 'queued' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
            <Spinner variant="dots" />
            <span>{t('video.status.queued')}</span>
          </div>
        )}
        {video && video.status === 'in_progress' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
            <Progress
              label={t('video.status.in_progress')}
              aria-label={t('video.status.in_progress')}
              className="max-w-md"
              color="primary"
              showValueLabel={true}
              size="md"
              value={video.progress}
            />
          </div>
        )}
        {video && video.status === 'completed' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-success-200">
            <CheckCircleIcon size={64} className="text-success" />
            <span className="font-bold text-2xl">{t('video.status.completed')}</span>
          </div>
        )}
        {video && video.status === 'downloading' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
            <Progress
              label={t('video.status.downloading')}
              aria-label={t('video.status.downloading')}
              className="max-w-md"
              color="primary"
              showValueLabel={true}
              size="md"
              value={video.progress}
            />
          </div>
        )}
        {video && video.status === 'downloaded' && loadSuccess !== false && (
          <video
            controls
            className="h-full w-full"
            onLoadedData={() => setLoadSuccess(true)}
            onError={() => setLoadSuccess(false)}>
            <source src="video.mp4" type="video/mp4" />
          </video>
        )}
        {video && video.status === 'failed' && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-danger-200">
            <CircleXIcon size={64} className="fill-danger text-danger-200" />
            <span className="font-bold text-2xl">{t('video.status.failed')}</span>
            <div className="my-2 flex justify-between gap-2">
              <Button onPress={onOpen}>{t('common.detail')}</Button>
              <Modal isOpen={isOpen} onClose={onClose}>
                <ModalBody>
                  <ModalContent>
                    <div className="p-4">
                      {video.error === null ? (
                        <Alert color="danger" title={t('error.unknown')} />
                      ) : (
                        <Alert color="danger" title={video.error.code} description={video.error.message} />
                      )}
                    </div>
                  </ModalContent>
                </ModalBody>
                <ModalFooter></ModalFooter>
              </Modal>
              <Button onPress={() => window.toast.info('Not implemented')}>{t('common.retry')}</Button>
            </div>
          </div>
        )}
        {video && video.status === 'downloaded' && loadSuccess === false && (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-danger-200">
            <CircleXIcon size={64} className="fill-danger text-danger-200" />
            <span className="font-bold text-2xl">{t('video.error.load.message')}</span>
            <span>{t('video.error.load.reason')}</span>
            <div className="my-2 flex justify-between gap-2">
              <Button onPress={() => window.toast.info('Not implemented')}>{t('common.redownload')}</Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
