export type GameRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUP'
export type Role = GameRole | 'FILL'

export type Rank = 'UNRANKED' | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER'

export interface RankRate {
  main: number
  sub: number
}

export const RANK_RATES: { [key in Rank]: RankRate } = {
  UNRANKED: { main: 0, sub: 0 },
  IRON: { main: 10, sub: 8 },
  BRONZE: { main: 20, sub: 16 },
  SILVER: { main: 30, sub: 24 },
  GOLD: { main: 40, sub: 32 },
  PLATINUM: { main: 50, sub: 40 },
  EMERALD: { main: 60, sub: 48 },
  DIAMOND: { main: 70, sub: 56 },
  MASTER: { main: 80, sub: 64 },
  GRANDMASTER: { main: 90, sub: 72 },
  CHALLENGER: { main: 100, sub: 80 }
}

export interface Player {
  id: string
  name: string
  mainRole: GameRole
  rates: { [key in GameRole]: number }
  stats: {
    wins: number
    losses: number
  }
}

export interface SelectedPlayer {
  player: Player
  preferredRoles: [Role, Role]
}

export interface TeamPlayer {
  player: Player
  role: GameRole
}

export interface Teams {
  blue: TeamPlayer[]
  red: TeamPlayer[]
}

export interface Match {
  id: string
  date: {
    seconds: number
    nanoseconds: number
  }
  players: {
    playerId: string
    role: Role
    team: 'BLUE' | 'RED'
  }[]
  winner: 'BLUE' | 'RED'
} 