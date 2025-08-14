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
  Checkbox,
  CheckboxGroup,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import { SearchIcon, DeleteIcon, RepeatIcon } from '@chakra-ui/icons'
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, GameRole, Match } from '../../types'
import Layout from '../../components/Layout'

interface SelectedPlayer {
  player: Player & { id: string }
  wantedRoles: GameRole[]
  unwantedRoles: GameRole[]
  roleWish?: GameRole | undefined
  roleWishPriority?: 'HIGH' | 'MEDIUM' | 'LOW' | undefined
}

export default function TeamMaker() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([])
  const [teams, setTeams] = useState<{
    blue: { player: Player; role: GameRole }[]
    red: { player: Player; role: GameRole }[]
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
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

  // 利用可能なタグを取得
  const availableTags = Array.from(
    new Set(
      players
        .flatMap(player => player.tags || [])
        .filter(tag => tag.trim() !== '')
    )
  ).sort()

  // フィルタリングされたプレイヤー
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => player.tags?.includes(tag))
    return matchesSearch && matchesTags
  })

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
        wantedRoles: [player.mainRole],
        unwantedRoles: [],
        roleWish: undefined,
        roleWishPriority: undefined,
      },
    ])
  }

  const handleRemovePlayer = (index: number) => {
    setSelectedPlayers(selectedPlayers.filter((_, i) => i !== index))
  }

  // やりたいロールを追加/削除
  const handleWantedRoleToggle = (index: number, role: GameRole) => {
    const newSelectedPlayers = [...selectedPlayers]
    const currentWantedRoles = newSelectedPlayers[index].wantedRoles
    const currentUnwantedRoles = newSelectedPlayers[index].unwantedRoles
    
    if (currentWantedRoles.includes(role)) {
      // やりたいロールから削除
      newSelectedPlayers[index].wantedRoles = currentWantedRoles.filter(r => r !== role)
    } else {
      // やりたいロールに追加（絶対にやりたくないロールからは削除）
      newSelectedPlayers[index].wantedRoles = [...currentWantedRoles, role]
      newSelectedPlayers[index].unwantedRoles = currentUnwantedRoles.filter(r => r !== role)
    }
    
    setSelectedPlayers(newSelectedPlayers)
  }

  // 絶対にやりたくないロールを追加/削除
  const handleUnwantedRoleToggle = (index: number, role: GameRole) => {
    const newSelectedPlayers = [...selectedPlayers]
    const currentWantedRoles = newSelectedPlayers[index].wantedRoles
    const currentUnwantedRoles = newSelectedPlayers[index].unwantedRoles
    
    if (currentUnwantedRoles.includes(role)) {
      // 絶対にやりたくないロールから削除
      newSelectedPlayers[index].unwantedRoles = currentUnwantedRoles.filter(r => r !== role)
    } else {
      // 絶対にやりたくないロールに追加（やりたいロールからは削除）
      newSelectedPlayers[index].unwantedRoles = [...currentUnwantedRoles, role]
      newSelectedPlayers[index].wantedRoles = currentWantedRoles.filter(r => r !== role)
    }
    
    setSelectedPlayers(newSelectedPlayers)
  }

  // ロール希望を設定
  const handleRoleWishChange = (index: number, roleWish: GameRole | undefined) => {
    const newSelectedPlayers = [...selectedPlayers]
    newSelectedPlayers[index].roleWish = roleWish
    // ロール希望を変更した場合、優先度をリセット
    if (roleWish) {
      newSelectedPlayers[index].roleWishPriority = 'MEDIUM'
    } else {
      newSelectedPlayers[index].roleWishPriority = undefined
    }
    setSelectedPlayers(newSelectedPlayers)
  }

  // ロール希望の優先度を設定
  const handleRoleWishPriorityChange = (index: number, priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    const newSelectedPlayers = [...selectedPlayers]
    newSelectedPlayers[index].roleWishPriority = priority
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

    // 絶対にやりたくないロールのチェック
    const allUnwantedRoles = selectedPlayers.flatMap(p => p.unwantedRoles)
    const roleCounts = {
      [GameRole.TOP]: 0,
      [GameRole.JUNGLE]: 0,
      [GameRole.MID]: 0,
      [GameRole.ADC]: 0,
      [GameRole.SUP]: 0,
    }
    
    // 各ロールの絶対にやりたくない人数をカウント
    allUnwantedRoles.forEach(role => {
      roleCounts[role]++
    })
    
    // 絶対にやりたくないロールが多すぎる場合のチェック
    const maxUnwantedPerRole = 8 // 10人中8人以上が絶対にやりたくない場合はチーム分け不可
    const problematicRoles = Object.entries(roleCounts).filter(([role, count]) => count >= maxUnwantedPerRole)
    
    if (problematicRoles.length > 0) {
      const roleNames = problematicRoles.map(([role]) => role).join(', ')
      toast({
        title: 'チーム分けエラー',
        description: `${roleNames}ロールを絶対にやりたくないプレイヤーが多すぎます。チーム分けができません。`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    // 各ロールのプレイヤーをグループ化（希望1のみ）
    const primaryRoleGroups: { [key in GameRole]: SelectedPlayer[] } = {
      [GameRole.TOP]: [],
      [GameRole.JUNGLE]: [],
      [GameRole.MID]: [],
      [GameRole.ADC]: [],
      [GameRole.SUP]: [],
    }

    // 各ロールのプレイヤーをグループ化（希望2とFILL）
    const secondaryRoleGroups: { [key in GameRole]: SelectedPlayer[] } = {
      [GameRole.TOP]: [],
      [GameRole.JUNGLE]: [],
      [GameRole.MID]: [],
      [GameRole.ADC]: [],
      [GameRole.SUP]: [],
    }

    // ロール希望を持つプレイヤーを優先的に配置
    const roleWishPlayers = selectedPlayers.filter(p => p.roleWish && p.roleWishPriority)
    const nonRoleWishPlayers = selectedPlayers.filter(p => !p.roleWish || !p.roleWishPriority)

    // ロール希望を持つプレイヤーを優先度順にソート
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
    const sortedRoleWishPlayers = roleWishPlayers.sort((a, b) => {
      const priorityA = priorityOrder[a.roleWishPriority!]
      const priorityB = priorityOrder[b.roleWishPriority!]
      return priorityB - priorityA
    })

    // ロール希望を持つプレイヤーを優先的に配置
    sortedRoleWishPlayers.forEach((player) => {
      const wishRole = player.roleWish!
      primaryRoleGroups[wishRole].unshift(player) // 先頭に追加して優先度を高める
    })

    // 通常のプレイヤーを配置
    nonRoleWishPlayers.forEach((player) => {
      // やりたいロールを優先的に配置
      if (player.wantedRoles.length > 0) {
        player.wantedRoles.forEach((role) => {
          primaryRoleGroups[role].push(player)
        })
      } else {
        // やりたいロールがない場合は、絶対にやりたくないロール以外を全ロールに追加
        Object.values(GameRole).forEach((gameRole) => {
          if (!player.unwantedRoles.includes(gameRole)) {
            primaryRoleGroups[gameRole].push(player)
          }
        })
      }

      // 絶対にやりたくないロール以外をセカンダリグループに追加
      Object.values(GameRole).forEach((gameRole) => {
        if (!player.unwantedRoles.includes(gameRole)) {
          secondaryRoleGroups[gameRole].push(player)
        }
      })
    })

    const roles: GameRole[] = [GameRole.TOP, GameRole.JUNGLE, GameRole.MID, GameRole.ADC, GameRole.SUP]
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

                    // まずやりたいロールでチームを作成
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
            if (player.wantedRoles.includes(role)) {
              primaryRoleCount++
            }
          }
        })
      }

      // 残りのロールを埋める（絶対にやりたくないロールは除外）
      const fillRemainingRoles = (team: typeof blueTeam) => {
        while (team.length < 5) {
          const availableRole = shuffledRoles.find(role => !team.some(p => p.role === role))
          if (!availableRole) break

          const availablePlayer = selectedPlayers
            .filter(p => !assignedPlayers.has(p.player.id) && !p.unwantedRoles.includes(availableRole))
            .sort(() => Math.random() - 0.5)[0]
          
          if (!availablePlayer) break

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
      // やりたいロールに配置できた人数を表示
      toast({
        title: 'チーム作成完了',
        description: `${maxPrimaryRoleCount}人がやりたいロールで配置されました`,
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
        const rateChange = isWinner ? 50 : -50

        await updateDoc(playerRef, {
          [`rates.${role}`]: player.rates[role as GameRole] + rateChange,
          [`stats.${isWinner ? 'wins' : 'losses'}`]: player.stats[isWinner ? 'wins' : 'losses'] + 1,
        })
      })

      await Promise.all(updatePromises)

      // プレイヤーリストを再取得して画面を更新
      const querySnapshot = await getDocs(collection(db, 'players'))
      const updatedPlayersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[]
      setPlayers(updatedPlayersData)

      toast({
        title: '成功',
        description: '試合結果を保存しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // チーム構成は保持し、選択されたプレイヤーはリセット
      setSelectedPlayers([])
      // setTeams(null) を削除してチーム構成を保持
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

  // 同じチーム構成で再戦する機能
  const handleRematch = () => {
    if (!teams) return
    
    // 現在のチーム構成から選択されたプレイヤーを再構築
    const newSelectedPlayers: SelectedPlayer[] = [
      ...teams.blue.map(({ player, role }) => ({
        player: player as Player & { id: string },
        wantedRoles: [role],
        unwantedRoles: [],
        roleWish: role, // 現在のロールをロール希望として設定
        roleWishPriority: 'HIGH' as const, // 再戦時は高優先度
      })),
      ...teams.red.map(({ player, role }) => ({
        player: player as Player & { id: string },
        wantedRoles: [role],
        unwantedRoles: [],
        roleWish: role, // 現在のロールをロール希望として設定
        roleWishPriority: 'HIGH' as const, // 再戦時は高優先度
      }))
    ]
    
    setSelectedPlayers(newSelectedPlayers)
    setTeams(null)
    
    toast({
      title: '再戦準備完了',
      description: '同じチーム構成で再戦の準備ができました（ロール希望も設定済み）',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
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
    const colors: { [key in GameRole]: string } = {
      [GameRole.TOP]: 'red',
      [GameRole.JUNGLE]: 'green',
      [GameRole.MID]: 'blue',
      [GameRole.ADC]: 'purple',
      [GameRole.SUP]: 'orange'
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
      <VStack spacing={6} align="stretch">
        <Heading textAlign="center" color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
          チームメーカー
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* プレイヤー選択エリア */}
          <Card>
            <CardHeader>
              <Heading size="md" color="gray.700">
                プレイヤー選択
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* 検索バー */}
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="プレイヤー名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="md"
                  />
                </InputGroup>

                {/* タグフィルター */}
                {availableTags.length > 0 && (
                  <Accordion allowToggle>
                    <AccordionItem>
                      <AccordionButton>
                        <Box as="span" flex="1" textAlign="left">
                          <Text fontSize="sm" fontWeight="bold">
                            タグで絞り込み ({selectedTags.length}個選択中)
                          </Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <VStack spacing={3} align="stretch">
                          <CheckboxGroup
                            value={selectedTags}
                            onChange={(values) => setSelectedTags(values as string[])}
                          >
                            <Wrap spacing={2}>
                              {availableTags.map((tag) => (
                                <WrapItem key={tag}>
                                  <Checkbox value={tag} colorScheme="blue">
                                    <Tag
                                      size="md"
                                      variant="outline"
                                      colorScheme="blue"
                                    >
                                      <TagLabel>{tag}</TagLabel>
                                    </Tag>
                                  </Checkbox>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </CheckboxGroup>
                          {selectedTags.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="gray"
                              onClick={() => setSelectedTags([])}
                            >
                              フィルターをクリア
                            </Button>
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                )}

                {/* プレイヤーリスト */}
                <Box maxH="400px" overflowY="auto">
                  <VStack spacing={2} align="stretch">
                    {filteredPlayers.map((player) => {
                      const isSelected = selectedPlayers.some((sp) => sp.player.id === player.id)
                      return (
                        <Card
                          key={player.id}
                          bg={isSelected ? 'blue.50' : 'white'}
                          border="1px solid"
                          borderColor={isSelected ? 'blue.200' : 'gray.200'}
                          cursor={isSelected ? 'not-allowed' : 'pointer'}
                          onClick={() => !isSelected && handleAddPlayer(player)}
                          _hover={!isSelected ? { bg: 'gray.50' } : {}}
                        >
                          <CardBody p={3}>
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between">
                                <Text fontWeight="bold">{player.name}</Text>
                                <Badge colorScheme={getRoleColor(player.mainRole)}>
                                  {player.mainRole}
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" color="gray.600">
                                レート: {player.rates[player.mainRole]}
                              </Text>
                              {player.tags && player.tags.length > 0 && (
                                <Wrap spacing={1}>
                                  {player.tags.map((tag, index) => (
                                    <WrapItem key={index}>
                                      <Tag size="sm" variant="outline" colorScheme="blue">
                                        <TagLabel>{tag}</TagLabel>
                                      </Tag>
                                    </WrapItem>
                                  ))}
                                </Wrap>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      )
                    })}
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* 選択されたプレイヤーエリア */}
          <Card>
            <CardHeader>
              <Heading size="md" color="gray.700">
                選択されたプレイヤー ({selectedPlayers.length}/10)
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {selectedPlayers.map((selectedPlayer, index) => (
                  <Card key={selectedPlayer.player.id} bg="blue.50">
                    <CardBody p={3}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{selectedPlayer.player.name}</Text>
                          <IconButton
                            aria-label="Remove player"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleRemovePlayer(index)}
                          />
                        </HStack>
                        <VStack spacing={3} align="stretch">
                          <Text fontSize="sm" fontWeight="bold" color="green.600">
                            やりたいロール
                          </Text>
                          <Wrap spacing={2}>
                            {Object.values(GameRole).map((role) => (
                              <WrapItem key={role}>
                                <Checkbox
                                  isChecked={selectedPlayer.wantedRoles.includes(role)}
                                  onChange={() => handleWantedRoleToggle(index, role)}
                                  colorScheme="green"
                                >
                                  <Tag
                                    size="md"
                                    variant={selectedPlayer.wantedRoles.includes(role) ? "solid" : "outline"}
                                    colorScheme="green"
                                  >
                                    <TagLabel>{role}</TagLabel>
                                  </Tag>
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                          
                          <Text fontSize="sm" fontWeight="bold" color="red.600">
                            絶対にやりたくないロール
                          </Text>
                          <Wrap spacing={2}>
                            {Object.values(GameRole).map((role) => (
                              <WrapItem key={role}>
                                <Checkbox
                                  isChecked={selectedPlayer.unwantedRoles.includes(role)}
                                  onChange={() => handleUnwantedRoleToggle(index, role)}
                                  colorScheme="red"
                                >
                                  <Tag
                                    size="md"
                                    variant={selectedPlayer.unwantedRoles.includes(role) ? "solid" : "outline"}
                                    colorScheme="red"
                                  >
                                    <TagLabel>{role}</TagLabel>
                                  </Tag>
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </VStack>
                        
                        {/* ロール希望設定 */}
                        <VStack spacing={3} align="stretch">
                          <Text fontSize="sm" fontWeight="bold" color="blue.600">
                            その日のロール希望
                          </Text>
                          <HStack spacing={4}>
                            <FormControl>
                              <FormLabel fontSize="sm">やりたいロール</FormLabel>
                              <Select
                                size="sm"
                                value={selectedPlayer.roleWish || ''}
                                onChange={(e) =>
                                  handleRoleWishChange(index, e.target.value ? e.target.value as GameRole : undefined)
                                }
                                placeholder="選択してください"
                              >
                                {Object.values(GameRole).map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm">優先度</FormLabel>
                              <Select
                                size="sm"
                                value={selectedPlayer.roleWishPriority || ''}
                                onChange={(e) =>
                                  handleRoleWishPriorityChange(index, e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')
                                }
                                placeholder="選択してください"
                                isDisabled={!selectedPlayer.roleWish}
                              >
                                <option value="HIGH">高</option>
                                <option value="MEDIUM">中</option>
                                <option value="LOW">低</option>
                              </Select>
                            </FormControl>
                          </HStack>
                          {selectedPlayer.roleWish && selectedPlayer.roleWishPriority && (
                            <HStack spacing={2}>
                              <Tag
                                size="sm"
                                variant="solid"
                                colorScheme={
                                  selectedPlayer.roleWishPriority === 'HIGH' ? 'red' :
                                  selectedPlayer.roleWishPriority === 'MEDIUM' ? 'orange' : 'green'
                                }
                              >
                                <TagLabel>
                                  {selectedPlayer.roleWish} ({selectedPlayer.roleWishPriority === 'HIGH' ? '高' : selectedPlayer.roleWishPriority === 'MEDIUM' ? '中' : '低'}優先度)
                                </TagLabel>
                              </Tag>
                            </HStack>
                          )}
                        </VStack>
                        
                        {selectedPlayer.player.tags && selectedPlayer.player.tags.length > 0 && (
                          <Wrap spacing={1}>
                            {selectedPlayer.player.tags.map((tag, tagIndex) => (
                              <WrapItem key={tagIndex}>
                                <Tag size="sm" variant="outline" colorScheme="blue">
                                  <TagLabel>{tag}</TagLabel>
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}

                {selectedPlayers.length === 0 && (
                  <Text textAlign="center" color="gray.500">
                    プレイヤーを選択してください
                  </Text>
                )}

                {selectedPlayers.length >= 10 && (
                  <Text textAlign="center" color="red.500" fontWeight="bold">
                    最大10人まで選択できます
                  </Text>
                )}

                <Button
                  colorScheme="blue"
                  onClick={createTeams}
                  isDisabled={selectedPlayers.length < 10}
                  size="lg"
                >
                  チーム作成
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {teams && (
          <>
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
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      プレイヤーをクリックすると相手チームのプレイヤーと入れ替えることができます
                    </Text>
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                      {team.map((player, teamIndex) => (
                        <Card
                          key={player.player.id}
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          borderWidth="1px"
                        >
                          <Menu>
                            <MenuButton as={Box} cursor="pointer" w="100%" h="100%">
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
                            </MenuButton>
                            <MenuList>
                              <MenuGroup title={`${name === 'チーム1' ? 'チーム2' : 'チーム1'}と交代`}>
                                {(name === 'チーム1' ? teams.red : teams.blue).map((otherPlayer, otherIndex) => (
                                  <MenuItem
                                    key={otherPlayer.player.id}
                                    onClick={() => {
                                      const otherTeamKey = name === 'チーム1' ? 'red' : 'blue'
                                      const currentTeamKey = name === 'チーム1' ? 'blue' : 'red'
                                      handleSwapPlayers(currentTeamKey, teamIndex, otherTeamKey, otherIndex)
                                    }}
                                  >
                                    {otherPlayer.player.name} ({otherPlayer.role})
                                    {' '}
                                    {(() => {
                                      const currentRate = player.role === player.player.mainRole ? 
                                        player.player.rates[player.role] : 
                                        Math.round(player.player.rates[player.role] * 0.8)
                                      const otherRate = otherPlayer.role === otherPlayer.player.mainRole ? 
                                        otherPlayer.player.rates[otherPlayer.role] : 
                                        Math.round(otherPlayer.player.rates[otherPlayer.role] * 0.8)
                                      const diff = otherRate - currentRate
                                      return (
                                        <Text as="span" color={diff > 0 ? 'green.500' : diff < 0 ? 'red.500' : 'gray.500'}>
                                          ({diff > 0 ? '+' : ''}{diff})
                                        </Text>
                                      )
                                    })()}
                                  </MenuItem>
                                ))}
                              </MenuGroup>
                            </MenuList>
                          </Menu>
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

            <Card>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Heading size="md" color="gray.700">
                    試合結果
                  </Heading>
                  <HStack spacing={2}>
                    <Button
                      leftIcon={<RepeatIcon />}
                      colorScheme="green"
                      onClick={createTeams}
                      size="sm"
                    >
                      チーム再生成
                    </Button>
                    <Button
                      leftIcon={<RepeatIcon />}
                      colorScheme="purple"
                      onClick={handleRematch}
                      size="sm"
                    >
                      同じチームで再戦
                    </Button>
                  </HStack>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Button
                    colorScheme="blue"
                    onClick={() => handleMatchResult('BLUE')}
                    size="lg"
                    width="100%"
                  >
                    チーム1の勝利
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => handleMatchResult('RED')}
                    size="lg"
                    width="100%"
                  >
                    チーム2の勝利
                  </Button>
                </SimpleGrid>
                <Button
                  colorScheme="purple"
                  as="a"
                  href="https://draftlol.dawe.gg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  width="100%"
                >
                  ドラフトツール
                </Button>
              </VStack>
            </Card>
          </>
        )}
      </VStack>
    </Layout>
  )
} 