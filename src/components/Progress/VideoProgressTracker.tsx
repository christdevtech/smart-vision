import ProgressHeartbeatTracker from './ProgressHeartbeatTracker'

export default function VideoProgressTracker({
  contentId,
}: {
  contentId: string
}) {
  return <ProgressHeartbeatTracker contentId={contentId} contentType="video" />
}

