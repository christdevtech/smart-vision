import ProgressHeartbeatTracker from './ProgressHeartbeatTracker'

export default function BookProgressTracker({
  contentId,
}: {
  contentId: string
}) {
  return <ProgressHeartbeatTracker contentId={contentId} contentType="book" />
}

