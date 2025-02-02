import React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ButtonGroup, Button, H2, H3 } from '@blueprintjs/core'
import { Wrapper } from '../../Atoms/Wrapper'
import { apiDownload } from '../../utilities'
import CreateAuditBoards from './CreateAuditBoards'
import RoundProgress from './RoundProgress'
import {
  downloadPlaceholders,
  downloadLabels,
  downloadAuditBoardCredentials,
} from './generateSheets'
import { IAuditBoard } from '../useAuditBoards'
import QRs from './QRs'
import RoundDataEntry from './RoundDataEntry'
import useAuditSettingsJurisdictionAdmin from './useAuditSettingsJurisdictionAdmin'
import BatchRoundDataEntry from './BatchRoundDataEntry'
import { useAuthDataContext, IJurisdictionAdmin } from '../../UserContext'
import { IRound } from '../useRoundsAuditAdmin'
import { IAuditSettings } from '../useAuditSettings'
import AsyncButton from '../../Atoms/AsyncButton'
import useSampleCount from './useBallots'
import FullHandTallyDataEntry from './FullHandTallyDataEntry'

const PaddedWrapper = styled(Wrapper)`
  flex-direction: column;
  align-items: flex-start;
  padding: 30px 0;
`

const SpacedDiv = styled.div`
  margin-bottom: 30px;
`

const StrongP = styled.p`
  font-weight: 500;
`

export interface IRoundManagementProps {
  round: IRound
  auditBoards: IAuditBoard[]
  createAuditBoards: (auditBoards: { name: string }[]) => Promise<boolean>
}

const RoundManagement = ({
  round,
  auditBoards,
  createAuditBoards,
}: IRoundManagementProps) => {
  const { electionId, jurisdictionId } = useParams<{
    electionId: string
    jurisdictionId: string
  }>()
  const auth = useAuthDataContext()
  const auditSettings = useAuditSettingsJurisdictionAdmin(
    electionId,
    jurisdictionId
  )
  const auditType = auditSettings && auditSettings.auditType
  const sampleCount = useSampleCount(
    electionId,
    jurisdictionId,
    round.id,
    auditType
  )

  if (!auth || !auth.user || !auditSettings || !sampleCount) return null // Still loading

  const jurisdiction = (auth.user as IJurisdictionAdmin).jurisdictions.find(
    j => j.id === jurisdictionId
  )!
  const { roundNum } = round

  if (round.isAuditComplete) {
    return (
      <PaddedWrapper>
        <H2>Congratulations! Your Risk-Limiting Audit is now complete.</H2>
      </PaddedWrapper>
    )
  }

  if (sampleCount.ballots === 0 && !round.isFullHandTally) {
    return (
      <PaddedWrapper>
        <StrongP>
          Your jurisdiction has not been assigned any ballots to audit in this
          round.
        </StrongP>
      </PaddedWrapper>
    )
  }

  const samplesToAudit = (() => {
    if (round.isFullHandTally)
      return (
        <StrongP>
          Please audit all of the ballots in your jurisdiction (
          {jurisdiction.numBallots} ballots)
        </StrongP>
      )
    if (auditSettings.auditType === 'BATCH_COMPARISON')
      return (
        <StrongP>
          Batches to audit: {sampleCount.batches!.toLocaleString()}
          <br />
          Total ballots in batches: {sampleCount.ballots.toLocaleString()}
        </StrongP>
      )
    return (
      <StrongP>
        Ballots to audit: {sampleCount.ballots.toLocaleString()}
      </StrongP>
    )
  })()

  if (auditBoards.length === 0) {
    return (
      <PaddedWrapper>
        <H3>Round {roundNum} Audit Board Setup</H3>
        {samplesToAudit}
        <CreateAuditBoards createAuditBoards={createAuditBoards} />
      </PaddedWrapper>
    )
  }

  return (
    <PaddedWrapper>
      <H3>Round {roundNum} Data Entry</H3>
      {round.isFullHandTally ? (
        samplesToAudit
      ) : (
        <SpacedDiv>
          {samplesToAudit}
          <JAFileDownloadButtons
            electionId={electionId}
            jurisdictionId={jurisdictionId}
            jurisdictionName={jurisdiction.name}
            round={round}
            auditSettings={auditSettings}
            auditBoards={auditBoards}
          />
        </SpacedDiv>
      )}
      <SpacedDiv>
        {auditSettings.auditType === 'BATCH_COMPARISON' ? (
          <BatchRoundDataEntry round={round} />
        ) : auditSettings.online ? (
          <RoundProgress auditBoards={auditBoards} />
        ) : round.isFullHandTally ? (
          <FullHandTallyDataEntry round={round} />
        ) : (
          <RoundDataEntry round={round} />
        )}
      </SpacedDiv>
    </PaddedWrapper>
  )
}

export interface IJAFileDownloadButtonsProps {
  electionId: string
  jurisdictionId: string
  jurisdictionName: string
  round: IRound
  auditSettings: IAuditSettings
  auditBoards: IAuditBoard[]
}

export const JAFileDownloadButtons = ({
  electionId,
  jurisdictionId,
  jurisdictionName,
  round,
  auditSettings,
  auditBoards,
}: IJAFileDownloadButtonsProps) => (
  <ButtonGroup vertical alignText="left">
    <Button
      icon="th"
      onClick={
        /* istanbul ignore next */ // tested in generateSheets.test.tsx
        () =>
          apiDownload(
            `/election/${electionId}/jurisdiction/${jurisdictionId}/round/${
              round.id
            }/${
              auditSettings.auditType === 'BATCH_COMPARISON'
                ? 'batches'
                : 'ballots'
            }/retrieval-list`
          )
      }
    >
      Download Aggregated{' '}
      {auditSettings.auditType === 'BATCH_COMPARISON' ? 'Batch' : 'Ballot'}{' '}
      Retrieval List
    </Button>
    {auditSettings.auditType !== 'BATCH_COMPARISON' && (
      <>
        <AsyncButton
          icon="document"
          onClick={() =>
            downloadPlaceholders(
              electionId,
              jurisdictionId,
              round,
              jurisdictionName,
              auditSettings.auditName
            )
          }
        >
          Download Placeholder Sheets
        </AsyncButton>
        <AsyncButton
          icon="label"
          onClick={() =>
            downloadLabels(
              electionId,
              jurisdictionId,
              round,
              jurisdictionName,
              auditSettings.auditName
            )
          }
        >
          Download Ballot Labels
        </AsyncButton>
        {auditSettings.online && (
          <>
            <AsyncButton
              icon="key"
              onClick={() =>
                downloadAuditBoardCredentials(
                  auditBoards,
                  jurisdictionName,
                  auditSettings.auditName
                )
              }
            >
              Download Audit Board Credentials
            </AsyncButton>
            <QRs passphrases={auditBoards.map(b => b.passphrase)} />
          </>
        )}
      </>
    )}
  </ButtonGroup>
)

export default RoundManagement
