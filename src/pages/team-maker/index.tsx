import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  VStack,
  Text,
  HStack,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuGroup,
  MenuItem,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, GameRole, Match } from '../../types'

interface SelectedPlayer {
  player: Player
  preferredRoles: [Role, Role]
}

export default function TeamMaker() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([])
  const [teams, setTeams] = useState<{
    blue: { player: Player; role: GameRole }[]
    red: { player: Player; role: GameRole }[]
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const toast = useToast()

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, 'players'))
      const playersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[]
      setPlayers(playersData)
    }

    fetchPlayers()
  }, [])

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddPlayer = (player: Player) => {
    if (selectedPlayers.length >= 10) {
      toast({
        title: 'エラー',
        description: '最大10人まで選択できます',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setSelectedPlayers([
      ...selectedPlayers,
      {
        player,
        preferredRoles: [player.mainRole, 'FILL'],
      },
    ])
  }

  const handleRemovePlayer = (index: number) => {
    setSelectedPlayers(selectedPlayers.filter((_, i) => i !== index))
  }

  const handleRoleChange = (index: number, roleIndex: 0 | 1, role: Role) => {
    const newSelectedPlayers = [...selectedPlayers]
    newSelectedPlayers[index].preferredRoles[roleIndex] = role
    setSelectedPlayers(newSelectedPlayers)
  }

  const calculateTeamRating = (team: { player: Player; role: GameRole }[]) => {
    return team.reduce((sum, { player, role }) => {
      return sum + (role === player.mainRole ? player.rates[role] : player.rates[role] * 0.8)
    }, 0)
  }

  const createTeams = () => {
    if (selectedPlayers.length !== 10) {
      toast({
        title: 'エラー',
        description: '10人を選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 各ロールのプレイヤーをグループ化
    const roleGroups: { [key in GameRole]: SelectedPlayer[] } = {
      TOP: [],
      JUNGLE: [],
      MID: [],
      ADC: [],
      SUP: [],
    }

    selectedPlayers.forEach((player) => {
      // FILLの場合は全ロールに追加
      player.preferredRoles.forEach((role) => {
        if (role === 'FILL') {
          Object.keys(roleGroups).forEach((gameRole) => {
            roleGroups[gameRole as GameRole].push(player)
          })
        } else {
          roleGroups[role as GameRole].push(player)
        }
      })
    })

    // 各ロールから1人ずつ選択してチームを作成
    const blueTeam: { player: Player; role: GameRole }[] = []
    const redTeam: { player: Player; role: GameRole }[] = []
    const assignedPlayers = new Set<string>()
    const roles: GameRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP']

    // 各ロールについて処理（ブルーチーム）
    roles.forEach(role => {
      if (blueTeam.length >= 5) return

      // そのロールを希望するプレイヤーを取得
      const availablePlayers = roleGroups[role]
        .filter(p => !assignedPlayers.has(p.player.id))
        .sort((a, b) => {
          const rateA = role === a.player.mainRole ? a.player.rates[role] : a.player.rates[role] * 0.8
          const rateB = role === b.player.mainRole ? b.player.rates[role] : b.player.rates[role] * 0.8
          return rateB - rateA
        })

      if (availablePlayers.length > 0) {
        const player = availablePlayers[0]
        blueTeam.push({ player: player.player, role })
        assignedPlayers.add(player.player.id)
      }
    })

    // 残りのロールを埋める（ブルーチーム）
    while (blueTeam.length < 5) {
      const availablePlayer = selectedPlayers.find(p => !assignedPlayers.has(p.player.id))
      if (!availablePlayer) break

      const availableRole = roles.find(role => !blueTeam.some(p => p.role === role))
      if (!availableRole) break

      blueTeam.push({ player: availablePlayer.player, role: availableRole })
      assignedPlayers.add(availablePlayer.player.id)
    }

    // レッドチームの作成（同様のロジック）
    roles.forEach(role => {
      if (redTeam.length >= 5) return

      const availablePlayers = roleGroups[role]
        .filter(p => !assignedPlayers.has(p.player.id))
        .sort((a, b) => {
          const rateA = role === a.player.mainRole ? a.player.rates[role] : a.player.rates[role] * 0.8
          const rateB = role === b.player.mainRole ? b.player.rates[role] : b.player.rates[role] * 0.8
          return rateB - rateA
        })

      if (availablePlayers.length > 0) {
        const player = availablePlayers[0]
        redTeam.push({ player: player.player, role })
        assignedPlayers.add(player.player.id)
      }
    })

    // 残りのロールを埋める（レッドチーム）
    while (redTeam.length < 5) {
      const availablePlayer = selectedPlayers.find(p => !assignedPlayers.has(p.player.id))
      if (!availablePlayer) break

      const availableRole = roles.find(role => !redTeam.some(p => p.role === role))
      if (!availableRole) break

      redTeam.push({ player: availablePlayer.player, role: availableRole })
      assignedPlayers.add(availablePlayer.player.id)
    }

    setTeams({ blue: blueTeam, red: redTeam })
  }

  const handleMatchResult = async (winner: 'BLUE' | 'RED') => {
    if (!teams) return

    const match: Omit<Match, 'id'> = {
      date: {
        seconds: Math.floor(new Date().getTime() / 1000),
        nanoseconds: 0
      },
      players: [
        ...teams.blue.map((p) => ({ playerId: p.player.id, role: p.role, team: 'BLUE' as const })),
        ...teams.red.map((p) => ({ playerId: p.player.id, role: p.role, team: 'RED' as const })),
      ],
      winner,
    }

    try {
      const matchRef = await addDoc(collection(db, 'matches'), match)

      // プレイヤーのレートを更新
      const updatePromises = match.players.map(async ({ playerId, role, team }) => {
        const playerRef = doc(db, 'players', playerId)
        const player = players.find((p) => p.id === playerId)
        if (!player) return

        const isWinner = team === winner
        const rateChange = isWinner ? 20 : -20

        await updateDoc(playerRef, {
          [`rates.${role}`]: player.rates[role as GameRole] + rateChange,
          [`stats.${isWinner ? 'wins' : 'losses'}`]: player.stats[isWinner ? 'wins' : 'losses'] + 1,
        })
      })

      await Promise.all(updatePromises)

      toast({
        title: '成功',
        description: '試合結果を保存しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // 状態をリセット
      setSelectedPlayers([])
      setTeams(null)
    } catch (error) {
      console.error('Error saving match:', error)
      toast({
        title: 'エラー',
        description: '試合結果の保存に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSwapPlayers = (team1: 'blue' | 'red', index1: number, team2: 'blue' | 'red', index2: number) => {
    if (!teams) return;

    const newTeams = {
      blue: [...teams.blue],
      red: [...teams.red],
    };

    const temp = newTeams[team1][index1];
    newTeams[team1][index1] = newTeams[team2][index2];
    newTeams[team2][index2] = temp;

    setTeams(newTeams);
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading>チーム自動振り分け</Heading>

        <Stack spacing={4} width="100%">
          <FormControl>
            <FormLabel>プレイヤーを検索</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="プレイヤー名で検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </FormControl>

          <Box maxH="300px" overflowY="auto">
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {filteredPlayers
                .filter((player) => !selectedPlayers.some((sp) => sp.player.id === player.id))
                .map((player) => (
                  <Card key={player.id} cursor="pointer" onClick={() => handleAddPlayer(player)}>
                    <CardBody>
                      <Text fontWeight="bold">{player.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        メインロール: {player.mainRole}
                      </Text>
                    </CardBody>
                  </Card>
                ))}
            </SimpleGrid>
          </Box>

          {selectedPlayers.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>
                選択済みプレイヤー
              </Heading>
              <Stack spacing={4}>
                {selectedPlayers.map((selectedPlayer, index) => (
                  <Card key={index}>
                    <CardBody>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{selectedPlayer.player.name}</Text>
                        <Button size="sm" colorScheme="red" onClick={() => handleRemovePlayer(index)}>
                          削除
                        </Button>
                      </HStack>
                      <Stack direction="row" mt={2}>
                        <FormControl>
                          <FormLabel>希望ロール1</FormLabel>
                          <Select
                            value={selectedPlayer.preferredRoles[0]}
                            onChange={(e) => handleRoleChange(index, 0, e.target.value as Role)}
                          >
                            {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP', 'FILL'].map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel>希望ロール2</FormLabel>
                          <Select
                            value={selectedPlayer.preferredRoles[1]}
                            onChange={(e) => handleRoleChange(index, 1, e.target.value as Role)}
                          >
                            {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP', 'FILL'].map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          <Button colorScheme="blue" onClick={createTeams}>
            {teams ? 'チームを再生成' : 'チームを作成'}
          </Button>

          {teams && (
            <Stack spacing={4}>
              <Card bg="blue.50">
                <CardHeader>
                  <Heading size="md">ブルーチーム</Heading>
                </CardHeader>
                <CardBody>
                  {teams.blue.map(({ player, role }, blueIndex) => (
                    <HStack key={blueIndex} justify="space-between">
                      <Text>
                        {player.name} ({role})
                      </Text>
                      <Menu>
                        <MenuButton as={Button} size="sm">
                          入れ替え
                        </MenuButton>
                        <MenuList>
                          <MenuGroup title="レッドチームと入れ替え">
                            {teams.red.map(({ player: redPlayer }, redIndex) => (
                              <MenuItem
                                key={redIndex}
                                onClick={() => handleSwapPlayers('blue', blueIndex, 'red', redIndex)}
                              >
                                {redPlayer.name}
                              </MenuItem>
                            ))}
                          </MenuGroup>
                        </MenuList>
                      </Menu>
                    </HStack>
                  ))}
                  <Text mt={2}>チームレート: {calculateTeamRating(teams.blue)}</Text>
                </CardBody>
              </Card>

              <Card bg="red.50">
                <CardHeader>
                  <Heading size="md">レッドチーム</Heading>
                </CardHeader>
                <CardBody>
                  {teams.red.map(({ player, role }, redIndex) => (
                    <HStack key={redIndex} justify="space-between">
                      <Text>
                        {player.name} ({role})
                      </Text>
                      <Menu>
                        <MenuButton as={Button} size="sm">
                          入れ替え
                        </MenuButton>
                        <MenuList>
                          <MenuGroup title="ブルーチームと入れ替え">
                            {teams.blue.map(({ player: bluePlayer }, blueIndex) => (
                              <MenuItem
                                key={blueIndex}
                                onClick={() => handleSwapPlayers('red', redIndex, 'blue', blueIndex)}
                              >
                                {bluePlayer.name}
                              </MenuItem>
                            ))}
                          </MenuGroup>
                        </MenuList>
                      </Menu>
                    </HStack>
                  ))}
                  <Text mt={2}>チームレート: {calculateTeamRating(teams.red)}</Text>
                </CardBody>
              </Card>

              <HStack spacing={4}>
                <Button colorScheme="blue" onClick={() => handleMatchResult('BLUE')}>
                  ブルーチームの勝利
                </Button>
                <Button colorScheme="red" onClick={() => handleMatchResult('RED')}>
                  レッドチームの勝利
                </Button>
                <Button
                  colorScheme="purple"
                  as="a"
                  href="https://draftlol.dawe.gg/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ドラフトツール
                </Button>
              </HStack>
            </Stack>
          )}
        </Stack>
      </VStack>
    </Container>
  )
} 