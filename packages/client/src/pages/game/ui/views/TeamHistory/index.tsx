import React from 'react'
import PropTypes from 'prop-types'
import useTitleBar from '../../hooks/useTitleBar'
import type { View } from '../../../common/types'
import Overall from './Overall'
import Players from './Players'
import RetiredJerseyNumbers from './RetiredJerseyNumbers'
import Seasons from './Seasons'
import { MoreLinks } from '../../components'

const TeamHistory = ({
  abbrev,
  bestRecord,
  championships,
  finalsAppearances,
  history,
  players,
  playoffAppearances,
  retiredJerseyNumbers,
  season,
  stats,
  tid,
  totalLost,
  totalOtl,
  totalTied,
  totalWinp,
  totalWon,
  userTid,
  worstRecord
}: View<'teamHistory'>) => {
  useTitleBar({
    title: 'Team History',
    dropdownView: 'team_history',
    dropdownFields: { teams: abbrev }
  })

  return (
    <>
      <MoreLinks type="team" page="team_history" abbrev={abbrev} tid={tid} />

      <div className="row">
        <div className="col-sm-5 col-md-3">
          <Overall
            bestRecord={bestRecord}
            championships={championships}
            finalsAppearances={finalsAppearances}
            playoffAppearances={playoffAppearances}
            totalLost={totalLost}
            totalOtl={totalOtl}
            totalTied={totalTied}
            totalWinp={totalWinp}
            totalWon={totalWon}
            worstRecord={worstRecord}
          />

          <h2 className="mt-3">Seasons</h2>
          <Seasons history={history} />
        </div>
        <div className="col-sm-7 col-md-9 mt-3 mt-sm-0">
          <h2>Retired Jersey Numbers</h2>
          <RetiredJerseyNumbers
            players={players}
            retiredJerseyNumbers={retiredJerseyNumbers}
            season={season}
            tid={tid}
            userTid={userTid}
          />
          <Players season={season} players={players} stats={stats} tid={tid} userTid={userTid} />
        </div>
      </div>
    </>
  )
}

TeamHistory.propTypes = {
  abbrev: PropTypes.string.isRequired,
  bestRecord: PropTypes.shape({
    lost: PropTypes.number.isRequired,
    playoffRoundsWon: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    tied: PropTypes.number,
    won: PropTypes.number.isRequired
  }).isRequired,
  championships: PropTypes.number.isRequired,
  history: PropTypes.arrayOf(
    PropTypes.shape({
      lost: PropTypes.number.isRequired,
      playoffRoundsWon: PropTypes.number.isRequired,
      season: PropTypes.number.isRequired,
      tied: PropTypes.number,
      won: PropTypes.number.isRequired
    })
  ).isRequired,
  players: PropTypes.arrayOf(PropTypes.object).isRequired,
  playoffAppearances: PropTypes.number.isRequired,
  stats: PropTypes.arrayOf(PropTypes.string).isRequired,
  tid: PropTypes.number.isRequired,
  totalLost: PropTypes.number.isRequired,
  totalTied: PropTypes.number,
  totalWon: PropTypes.number.isRequired,
  worstRecord: PropTypes.shape({
    lost: PropTypes.number.isRequired,
    playoffRoundsWon: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    tied: PropTypes.number,
    won: PropTypes.number.isRequired
  }).isRequired
}

export default TeamHistory
