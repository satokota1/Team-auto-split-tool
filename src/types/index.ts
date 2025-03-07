export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUP' | 'FILL';
export type GameRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUP';  // 実際のゲーム内ロール
export type Rank = 'UNRANK' | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLAT' | 'EME' | 'DIA' | 'MASTER' | 'GM' | 'CHALLENGER';

export interface Player {
  id: string;
  name: string;
  mainRole: GameRole;
  rates: {
    [key in GameRole]: number;
  };
  stats: {
    wins: number;
    losses: number;
  };
}

export interface Match {
  id: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  players: {
    playerId: string;
    role: Role;
    team: 'BLUE' | 'RED';
  }[];
  winner: 'BLUE' | 'RED';
}

export const RANK_RATES = {
  UNRANK: { main: 200, sub: 160 },
  IRON: { main: 300, sub: 240 },
  BRONZE: { main: 520, sub: 416 },
  SILVER: { main: 760, sub: 608 },
  GOLD: { main: 1000, sub: 800 },
  PLAT: { main: 1240, sub: 992 },
  EME: { main: 1480, sub: 1184 },
  DIA: { main: 1640, sub: 1312 },
  MASTER: { main: 1760, sub: 1408 },
  GM: { main: 1860, sub: 1500 },
  CHALLENGER: { main: 1980, sub: 1620 },
} as const; 