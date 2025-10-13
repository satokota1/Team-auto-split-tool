export enum GameRole {
  TOP = 'TOP',
  JUNGLE = 'JUNGLE',
  MID = 'MID',
  ADC = 'ADC',
  SUP = 'SUP'
}

export type Role = GameRole | 'FILL'

export type Rank = 'UNRANKED' | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER'

export interface RankRate {
  main: number
  sub: number
}

export const RANK_RATES: { [key in Rank]: RankRate } = {
  UNRANKED: { main: 500, sub: 400 },
  IRON: { main: 600, sub: 480 },
  BRONZE: { main: 1300, sub: 1040 },
  SILVER: { main: 1500, sub: 1200 },
  GOLD: { main: 1700, sub: 1360 },
  PLATINUM: { main: 1900, sub: 1520 },
  EMERALD: { main: 2000, sub: 1600 },
  DIAMOND: { main: 2200, sub: 1760 },
  MASTER: { main: 2500, sub: 2000 },
  GRANDMASTER: { main: 2700, sub: 2160 },
  CHALLENGER: { main: 3000, sub: 2400 }
}

export interface Player {
  id: string
  name: string
  mainRole: GameRole
  mainRate: number
  subRate: number
  stats: {
    wins: number
    losses: number
  }
  tags?: string[] // タグ機能を追加
}

export interface SelectedPlayer {
  player: Player & { id: string }
  preferredRoles: [Role, Role]
  roleWish?: GameRole // その日にやりたいロールの希望
  roleWishPriority?: 'HIGH' | 'MEDIUM' | 'LOW' // ロール希望の優先度
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