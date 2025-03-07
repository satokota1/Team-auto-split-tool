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
  Badge,
  IconButton,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react'
import { SearchIcon, DeleteIcon, RepeatIcon } from '@chakra-ui/icons'
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, GameRole, Match } from '../../types'
import Layout from '../../components/Layout'

interface SelectedPlayer {
  player: Player & { id: string }
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
    return Math.round(team.reduce((sum, { player, role }) => {
      return sum + (role === player.mainRole ? player.rates[role] : Math.round(player.rates[role] * 0.8))
    }, 0))
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

    // 各ロールのプレイヤーをグループ化（希望1のみ）
    const primaryRoleGroups: { [key in GameRole]: SelectedPlayer[] } = {
      TOP: [],
      JUNGLE: [],
      MID: [],
      ADC: [],
      SUP: [],
    }

    // 各ロールのプレイヤーをグループ化（希望2とFILL）
    const secondaryRoleGroups: { [key in GameRole]: SelectedPlayer[] } = {
      TOP: [],
      JUNGLE: [],
      MID: [],
      ADC: [],
      SUP: [],
    }

    selectedPlayers.forEach((player) => {
      // 希望1のロールを追加
      if (player.preferredRoles[0] !== 'FILL') {
        primaryRoleGroups[player.preferredRoles[0] as GameRole].push(player)
      }

      // 希望2のロールとFILLを追加
      if (player.preferredRoles[1] === 'FILL') {
        Object.keys(secondaryRoleGroups).forEach((gameRole) => {
          secondaryRoleGroups[gameRole as GameRole].push(player)
        })
      } else {
        secondaryRoleGroups[player.preferredRoles[1] as GameRole].push(player)
      }

      // 希望1がFILLの場合は全ロールに追加
      if (player.preferredRoles[0] === 'FILL') {
        Object.keys(primaryRoleGroups).forEach((gameRole) => {
          primaryRoleGroups[gameRole as GameRole].push(player)
        })
      }
    })

    const roles: GameRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP']
    let bestTeams: { blue: { player: Player; role: GameRole }[]; red: { player: Player; role: GameRole }[] } | null = null
    let minRateDifference = Infinity
    let maxPrimaryRoleCount = -1 // 希望1のロールで配置できたプレイヤーの数を追跡

    // 複数回試行してベストな組み合わせを見つける
    for (let attempt = 0; attempt < 100; attempt++) {
      const blueTeam: { player: Player; role: GameRole }[] = []
      const redTeam: { player: Player; role: GameRole }[] = []
      const assignedPlayers = new Set<string>()
      let primaryRoleCount = 0 // この試行で希望1のロールに配置できたプレイヤーの数

      // ランダムな順序でロールを処理
      const shuffledRoles = [...roles].sort(() => Math.random() - 0.5)

      // まず希望1のロールでチームを作成
      const createTeamWithPrimaryRoles = (team: typeof blueTeam, roleGroups: typeof primaryRoleGroups) => {
        shuffledRoles.forEach(role => {
          if (team.length >= 5) return

          const availablePlayers = roleGroups[role]
            .filter(p => !assignedPlayers.has(p.player.id))
            .sort(() => Math.random() - 0.5)

          if (availablePlayers.length > 0) {
            const player = availablePlayers[0]
            team.push({ player: player.player, role })
            assignedPlayers.add(player.player.id)
            if (player.preferredRoles[0] === role || player.preferredRoles[0] === 'FILL') {
              primaryRoleCount++
            }
          }
        })
      }

      // 残りのロールを希望2とFILLで埋める
      const fillRemainingRoles = (team: typeof blueTeam) => {
        while (team.length < 5) {
          const availablePlayer = selectedPlayers
            .filter(p => !assignedPlayers.has(p.player.id))
            .sort(() => Math.random() - 0.5)[0]
          if (!availablePlayer) break

          const availableRole = shuffledRoles.find(role => !team.some(p => p.role === role))
          if (!availableRole) break

          team.push({ player: availablePlayer.player, role: availableRole })
          assignedPlayers.add(availablePlayer.player.id)
        }
      }

      // ブルーチームを作成
      createTeamWithPrimaryRoles(blueTeam, primaryRoleGroups)
      fillRemainingRoles(blueTeam)

      // レッドチームを作成
      createTeamWithPrimaryRoles(redTeam, primaryRoleGroups)
      fillRemainingRoles(redTeam)

      // チームが完成している場合のみ評価
      if (blueTeam.length === 5 && redTeam.length === 5) {
        const blueRating = calculateTeamRating(blueTeam)
        const redRating = calculateTeamRating(redTeam)
        const rateDifference = Math.abs(blueRating - redRating)

        // より良い組み合わせの条件：
        // 1. より多くのプレイヤーが希望1のロールに配置されている
        // 2. 同じ希望1ロール数の場合、チームレートの差が小さい
        if (primaryRoleCount > maxPrimaryRoleCount || 
            (primaryRoleCount === maxPrimaryRoleCount && rateDifference < minRateDifference)) {
          maxPrimaryRoleCount = primaryRoleCount
          minRateDifference = rateDifference
          bestTeams = { blue: blueTeam, red: redTeam }
        }
      }
    }

    if (bestTeams) {
      setTeams(bestTeams)
      // 希望1のロールに配置できた人数を表示
      toast({
        title: 'チーム作成完了',
        description: `${maxPrimaryRoleCount}人が第一希望のロールで配置されました`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    }
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

  const getRoleColor = (role: GameRole) => {
    const colors = {
      TOP: 'red',
      JUNGLE: 'green',
      MID: 'blue',
      ADC: 'purple',
      SUP: 'orange',
      FILL: 'gray'
    }
    return colors[role] || 'gray'
  }

  const calculateAverageRate = (team: { player: Player; role: GameRole }[]) => {
    if (team.length === 0) return 0
    const totalRate = team.reduce((sum, { player, role }) => {
      const rate = role === player.mainRole ? 
        player.rates[role] : 
        Math.round(player.rates[role] * 0.8)
      return sum + rate
    }, 0)
    return Math.round(totalRate / team.length)
  }

  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
            チーム分け
          </Heading>
          <Button
            leftIcon={<RepeatIcon />}
            colorScheme="blue"
            onClick={createTeams}
            isDisabled={selectedPlayers.length !== 10}
            size="md"
            boxShadow="md"
            _hover={{ 
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
          >
            チームを作成
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card>
            <VStack align="stretch" spacing={4}>
              <Heading size="md" color="gray.700">
                プレイヤー選択 ({selectedPlayers.length}/10)
              </Heading>
              <Box maxH="400px" overflowY="auto" px={2}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                  {players
                    .filter((p) => !selectedPlayers.some((sp) => sp.id === p.id))
                    .map((player) => (
                      <Card
                        key={player.id}
                        onClick={() => handleAddPlayer(player)}
                        cursor="pointer"
                        _hover={{
                          transform: 'translateY(-2px)',
                          boxShadow: 'md',
                        }}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                      >
                        <VStack align="stretch" spacing={2}>
                          <Text fontWeight="bold">{player.name}</Text>
                          <Badge
                            colorScheme={getRoleColor(player.mainRole)}
                            alignSelf="flex-start"
                          >
                            {player.mainRole}
                          </Badge>
                          <Text fontSize="sm" color="gray.500">
                            レート: {player.rates[player.mainRole]}
                          </Text>
                        </VStack>
                      </Card>
                    ))}
                </SimpleGrid>
              </Box>
            </VStack>
          </Card>

          <Card>
            <VStack align="stretch" spacing={4}>
              <Heading size="md" color="gray.700">
                選択済みプレイヤー
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                {selectedPlayers.map((player, index) => (
                  <Card
                    key={player.player.id}
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{player.player.name}</Text>
                        <Badge
                          colorScheme={getRoleColor(player.player.mainRole)}
                        >
                          {player.player.mainRole}
                        </Badge>
                      </VStack>
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Remove player"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleRemovePlayer(index)}
                      />
                    </HStack>
                  </Card>
                ))}
              </SimpleGrid>
            </VStack>
          </Card>
        </SimpleGrid>

        {teams && (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {[
              { team: teams.blue, name: 'チーム1', color: 'blue' },
              { team: teams.red, name: 'チーム2', color: 'red' },
            ].map(({ team, name, color }) => (
              <Card key={name}>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md" color={`${color}.600`}>
                    {name}
                  </Heading>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                    {team.map((player) => (
                      <Card
                        key={player.player.id}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderWidth="1px"
                      >
                        <VStack align="stretch" spacing={1}>
                          <Text fontWeight="bold">{player.player.name}</Text>
                          <Badge
                            colorScheme={getRoleColor(player.role)}
                          >
                            {player.role}
                          </Badge>
                          <Text fontSize="sm" color="gray.500">
                            レート: {player.role === player.player.mainRole ? player.player.rates[player.role] : Math.round(player.player.rates[player.role] * 0.8)}
                          </Text>
                        </VStack>
                      </Card>
                    ))}
                  </SimpleGrid>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontWeight="bold">平均レート:</Text>
                    <Text>{calculateAverageRate(team)}</Text>
                  </HStack>
                </VStack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Layout>
  )
} 