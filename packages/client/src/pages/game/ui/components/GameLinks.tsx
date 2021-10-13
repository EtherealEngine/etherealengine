import React from 'react'
import { GAME_NAME } from '../../common'

const GameLinks = ({ noLinks, thisGameText }: { noLinks?: boolean; thisGameText?: string }) => {
  const games = [
    {
      name: 'Basketball GM',
      url: 'https://play.basketball-gm.com/'
    }
  ]

  const otherGames = games.filter((game) => game.name !== GAME_NAME)
  const thisGame = games.find((game) => game.name === GAME_NAME)
  if (!thisGame) {
    throw new Error('Game not found')
  }

  return (
    <>
      {thisGameText ? thisGameText : thisGame.name},{' '}
      {noLinks ? (
        `${otherGames[0].name}, and ${otherGames[1].name}`
      ) : (
        <>
          <a href={otherGames[0].url}>{otherGames[0].name}</a>, and <a href={otherGames[1].url}>{otherGames[1].name}</a>
        </>
      )}
    </>
  )
}

export default GameLinks
