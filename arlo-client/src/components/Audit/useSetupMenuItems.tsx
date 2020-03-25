import { useState, useMemo } from 'react'
import { setupStages } from './Setup'
import { ElementType } from '../../types'
import { ISidebarMenuItem } from '../Atoms/Sidebar'

function useSetupMenuItems(
  stage: ElementType<typeof setupStages>,
  setStage: (s: ElementType<typeof setupStages>) => void
): [ISidebarMenuItem[], () => void] {
  const [participants, setParticipants] = useState<ISidebarMenuItem['state']>(
    'live'
  )
  const [targetContests, setTargetContests] = useState<
    ISidebarMenuItem['state']
  >('live')
  const [opportunisticContests, setOpportunisticContests] = useState<
    ISidebarMenuItem['state']
  >('live')
  const [auditSettings, setAuditSettings] = useState<ISidebarMenuItem['state']>(
    'live'
  )
  const [reviewLaunch, setReviewLaunch] = useState<ISidebarMenuItem['state']>(
    'live'
  )

  const refresh = () => {
    setParticipants('live')
    setTargetContests('live')
    setOpportunisticContests('live')
    setAuditSettings('live')
    setReviewLaunch('live')
  }

  const menuItems: ISidebarMenuItem[] = useMemo(
    () =>
      setupStages.map((s: ElementType<typeof setupStages>) => {
        const state = (() => {
          // move these to useStates, so they can be asynchronously updated
          switch (s) {
            case 'Participants':
              return participants
            case 'Target Contests':
              return targetContests
            case 'Opportunistic Contests':
              return opportunisticContests
            case 'Audit Settings':
              return auditSettings
            case 'Review & Launch':
              return reviewLaunch
            /* istanbul ignore next */
            default:
              return 'locked'
          }
        })()
        return {
          title: s,
          active: s === stage,
          activate: (_, force = false) => {
            /* istanbul ignore else */
            if (state === 'live') {
              /* istanbul ignore next */
              if (!force) {
                // launch confirm dialog
              }
              setStage(s)
            }
          },
          state,
        }
      }),
    [
      stage,
      setStage,
      participants,
      targetContests,
      opportunisticContests,
      auditSettings,
      reviewLaunch,
    ]
  )
  return [menuItems, refresh]
}

export default useSetupMenuItems