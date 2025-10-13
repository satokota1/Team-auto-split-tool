import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Text,
  Tag,
  TagLabel,
  Select,
  Flex,
  Wrap,
  WrapItem,
  useToast,
  TagCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player, GameRole } from '@/types'
import Layout from '@/components/Layout'
import Card from '@/components/Card'
import Link from 'next/link'
import { runMigration } from '@/utils/migrateExistingPlayers'
import { cleanupInvalidTags } from '@/utils/cleanupTags'

// 利用可能なタグオプション
const AVAILABLE_TAGS = ['249', 'SHIFT', 'きらくに']

interface EditingState {
  id: string | null;
  newName: string;
}

interface EditingRates {
  id: string;
  mainRate: number;
  subRate: number;
}

export default function Players() {
  const [players, setPlayers] = useState<(Player & { id: string })[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editing, setEditing] = useState<{ id: string; newName: string } | null>(null)
  const [editingTags, setEditingTags] = useState<{ id: string; tags: string[] } | null>(null)
  const [editingRates, setEditingRates] = useState<EditingRates | null>(null)
  const [tagInput, setTagInput] = useState('')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const toast = useToast()

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, 'players'))
      const playersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Player & { id: string })[]
      setPlayers(playersData)
    }

    fetchPlayers()
  }, [])

  const getRoleColor = (role: GameRole) => {
    const colors = {
      TOP: 'red',
      JUNGLE: 'green',
      MID: 'blue',
      ADC: 'purple',
      SUP: 'orange'
    }
    return colors[role]
  }

  const handleEditClick = (player: Player & { id: string }) => {
    setEditing({ 
      id: player.id, 
      newName: player.name
    })
  }

  const handleCancelEdit = () => {
    setEditing(null)
  }

  const handleSaveEdit = async (playerId: string) => {
    if (!editing?.newName.trim()) {
      toast({
        title: 'エラー',
        description: '名前を入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const playerRef = doc(db, 'players', playerId)
      await updateDoc(playerRef, {
        name: editing.newName.trim()
      })

      setPlayers(players.map(p => 
        p.id === playerId 
          ? { ...p, name: editing.newName.trim() }
          : p
      ))

      setEditing(null)

      toast({
        title: '更新完了',
        description: 'プレイヤー名を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'エラー',
        description: '更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // タグを追加
  const addTag = (playerId: string) => {
    if (tagInput.trim() && editingTags && !editingTags.tags.includes(tagInput.trim())) {
      setEditingTags({
        ...editingTags,
        tags: [...editingTags.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  // タグを削除
  const removeTag = (playerId: string, tagToRemove: string) => {
    if (editingTags) {
      setEditingTags({
        ...editingTags,
        tags: editingTags.tags.filter(tag => tag !== tagToRemove)
      })
    }
  }

  // タグ編集を開始
  const handleEditTagsClick = (player: Player & { id: string }) => {
    setEditingTags({
      id: player.id,
      tags: player.tags || []
    })
  }

  // タグ編集を保存
  const handleSaveTags = async (playerId: string) => {
    if (!editingTags) return

    try {
      const playerRef = doc(db, 'players', playerId)
      await updateDoc(playerRef, {
        tags: editingTags.tags.length > 0 ? editingTags.tags : null
      })

      // プレイヤーリストを更新
      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, tags: editingTags.tags.length > 0 ? editingTags.tags : undefined }
          : player
      ))

      setEditingTags(null)
      toast({
        title: '成功',
        description: 'タグを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error updating tags:', error)
      toast({
        title: 'エラー',
        description: 'タグの更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // タグ編集をキャンセル
  const handleCancelTags = () => {
    setEditingTags(null)
    setTagInput('')
  }

  const handleEditRatesClick = (player: Player & { id: string }) => {
    setEditingRates({
      id: player.id,
      mainRate: player.mainRate,
      subRate: player.subRate
    })
  }

  const handleSaveRates = async (playerId: string) => {
    if (!editingRates) return

    try {
      const playerRef = doc(db, 'players', playerId)
      await updateDoc(playerRef, {
        mainRate: editingRates.mainRate,
        subRate: editingRates.subRate
      })

      // プレイヤーリストを更新
      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, mainRate: editingRates.mainRate, subRate: editingRates.subRate }
          : player
      ))

      setEditingRates(null)
      toast({
        title: '成功',
        description: 'レートを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error updating rates:', error)
      toast({
        title: 'エラー',
        description: 'レートの更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleCancelRates = () => {
    setEditingRates(null)
  }

  const handleMainRateChange = (value: number) => {
    if (editingRates) {
      setEditingRates({
        ...editingRates,
        mainRate: value
      })
    }
  }

  const handleSubRateChange = (value: number) => {
    if (editingRates) {
      setEditingRates({
        ...editingRates,
        subRate: value
      })
    }
  }

  // 既存プレイヤーのレート移行
  const handleMigration = async () => {
    if (!window.confirm('既存プレイヤーのレートデータを移行しますか？\n\nこの操作は一度だけ実行してください。')) {
      return
    }

    try {
      await runMigration()
      // プレイヤーリストを再取得
      const querySnapshot = await getDocs(collection(db, 'players'))
      const playersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Player & { id: string })[]
      setPlayers(playersData)
    } catch (error) {
      console.error('移行エラー:', error)
    }
  }

  // 不要なタグをクリーンアップ
  const handleCleanupTags = async () => {
    if (!window.confirm('不要なタグ（sadas、アズカバン）を削除しますか？')) {
      return
    }

    try {
      const updatedCount = await cleanupInvalidTags()
      toast({
        title: 'クリーンアップ完了',
        description: `${updatedCount}人のプレイヤーのタグを更新しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      // プレイヤーリストを再読み込み
      fetchPlayers()
    } catch (error) {
      console.error('Cleanup error:', error)
      toast({
        title: 'クリーンアップエラー',
        description: 'タグのクリーンアップ中にエラーが発生しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

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

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
            『プレイヤー』一覧
          </Heading>
          <HStack spacing={3}>
            <Button
              colorScheme="orange"
              size="md"
              onClick={handleMigration}
              boxShadow="md"
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
            >
              レート移行
            </Button>
            <Button
              colorScheme="red"
              size="md"
              onClick={handleCleanupTags}
              boxShadow="md"
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
            >
              タグクリーンアップ
            </Button>
            <Link href="/players/new" passHref>
              <Button
                as="a"
                colorScheme="blue"
                size="md"
                leftIcon={<AddIcon />}
                boxShadow="md"
                _hover={{ 
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg'
                }}
              >
                新規登録
              </Button>
            </Link>
          </HStack>
        </HStack>

        <Card>
          <Box p={4}>
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
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    タグで絞り込み:
                  </Text>
                  <Wrap spacing={2}>
                    {availableTags.map((tag) => (
                      <WrapItem key={tag}>
                        <Tag
                          size="md"
                          variant={selectedTags.includes(tag) ? "solid" : "outline"}
                          colorScheme={selectedTags.includes(tag) ? "blue" : "gray"}
                          cursor="pointer"
                          onClick={() => {
                            if (selectedTags.includes(tag)) {
                              setSelectedTags(selectedTags.filter(t => t !== tag))
                            } else {
                              setSelectedTags([...selectedTags, tag])
                            }
                          }}
                          _hover={{ opacity: 0.8 }}
                        >
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                  {selectedTags.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={() => setSelectedTags([])}
                      mt={2}
                    >
                      フィルターをクリア
                    </Button>
                  )}
                </Box>
              )}
            </VStack>
          </Box>

          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th borderColor={borderColor}>名前</Th>
                  <Th borderColor={borderColor}>メインロール</Th>
                  <Th borderColor={borderColor}>タグ</Th>
                  <Th borderColor={borderColor} isNumeric>勝率</Th>
                  <Th borderColor={borderColor} isNumeric>メインロールレート</Th>
                  <Th borderColor={borderColor} isNumeric>サブロールレート</Th>
                  <Th borderColor={borderColor} width="120px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPlayers.map((player) => {
                  const winRate = player.stats.wins + player.stats.losses > 0
                    ? Math.round((player.stats.wins / (player.stats.wins + player.stats.losses)) * 100)
                    : 0

                  const isEditing = editing?.id === player.id
                  const isEditingTags = editingTags?.id === player.id
                  const isEditingRates = editingRates?.id === player.id

                  return (
                    <Tr 
                      key={player.id}
                      _hover={{ bg: 'gray.50' }}
                      transition="background-color 0.2s"
                    >
                      <Td borderColor={borderColor}>
                        {isEditing ? (
                          <Input
                            value={editing.newName}
                            onChange={(e) => setEditing({ ...editing, newName: e.target.value })}
                            size="sm"
                            width="200px"
                          />
                        ) : (
                          player.name
                        )}
                      </Td>
                      <Td borderColor={borderColor}>
                        <Badge 
                          colorScheme={getRoleColor(player.mainRole)}
                          fontSize="sm"
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {player.mainRole}
                        </Badge>
                      </Td>
                      <Td borderColor={borderColor}>
                        {isEditingTags ? (
                          <VStack spacing={2} align="stretch">
                            <Wrap spacing={2}>
                              {AVAILABLE_TAGS.map((tag) => (
                                <WrapItem key={tag}>
                                  <Checkbox
                                    isChecked={editingTags.tags.includes(tag)}
                                    onChange={() => {
                                      if (editingTags.tags.includes(tag)) {
                                        removeTag(player.id, tag)
                                      } else {
                                        setEditingTags({
                                          ...editingTags,
                                          tags: [...editingTags.tags, tag]
                                        })
                                      }
                                    }}
                                    colorScheme="blue"
                                    size="sm"
                                  >
                                    <Tag
                                      size="sm"
                                      variant={editingTags.tags.includes(tag) ? "solid" : "outline"}
                                      colorScheme="blue"
                                    >
                                      <TagLabel>{tag}</TagLabel>
                                    </Tag>
                                  </Checkbox>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </VStack>
                        ) : (
                          <Wrap spacing={1}>
                            {player.tags?.map((tag, index) => (
                              <WrapItem key={index}>
                                <Tag
                                  size="sm"
                                  variant="outline"
                                  colorScheme="blue"
                                  cursor="pointer"
                                  onClick={() => {
                                    if (!selectedTags.includes(tag)) {
                                      setSelectedTags([...selectedTags, tag])
                                    }
                                  }}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  <TagLabel>{tag}</TagLabel>
                                </Tag>
                              </WrapItem>
                            )) || (
                              <Text fontSize="sm" color="gray.400">
                                タグなし
                              </Text>
                            )}
                          </Wrap>
                        )}
                      </Td>
                      <Td borderColor={borderColor} isNumeric>
                        <Text 
                          color={winRate >= 50 ? 'green.500' : 'red.500'}
                          fontWeight="bold"
                        >
                          {winRate}%
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          ({player.stats.wins}勝{player.stats.losses}敗)
                        </Text>
                      </Td>
                      {/* メインロールレート */}
                      <Td borderColor={borderColor} isNumeric>
                        {isEditingRates ? (
                          <NumberInput
                            size="sm"
                            min={0}
                            max={5000}
                            value={editingRates.mainRate}
                            onChange={(_, value) => handleMainRateChange(value)}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        ) : (
                          <Text fontWeight="bold" color="blue.600">
                            {player.mainRate}
                          </Text>
                        )}
                      </Td>
                      {/* サブロールレート */}
                      <Td borderColor={borderColor} isNumeric>
                        {isEditingRates ? (
                          <NumberInput
                            size="sm"
                            min={0}
                            max={5000}
                            value={editingRates.subRate}
                            onChange={(_, value) => handleSubRateChange(value)}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        ) : (
                          <Text fontWeight="bold" color="gray.600">
                            {player.subRate}
                          </Text>
                        )}
                      </Td>
                      <Td borderColor={borderColor}>
                        <HStack spacing={2} justify="flex-end">
                          {isEditing ? (
                            <>
                              <IconButton
                                aria-label="Save"
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleSaveEdit(player.id)}
                              />
                              <IconButton
                                aria-label="Cancel"
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleCancelEdit}
                              />
                            </>
                          ) : isEditingTags ? (
                            <>
                              <IconButton
                                aria-label="Save tags"
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleSaveTags(player.id)}
                              />
                              <IconButton
                                aria-label="Cancel tags"
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleCancelTags}
                              />
                            </>
                          ) : isEditingRates ? (
                            <>
                              <IconButton
                                aria-label="Save rates"
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleSaveRates(player.id)}
                              />
                              <IconButton
                                aria-label="Cancel rates"
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleCancelRates}
                              />
                            </>
                          ) : (
                            <>
                              <IconButton
                                aria-label="Edit name"
                                icon={<EditIcon />}
                                size="sm"
                                colorScheme="blue"
                                onClick={() => handleEditClick(player)}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="blue"
                                onClick={() => handleEditTagsClick(player)}
                              >
                                タグ編集
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="green"
                                onClick={() => handleEditRatesClick(player)}
                              >
                                レート編集
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        </Card>

        <Text fontSize="sm" color="gray.600" textAlign="center">
          ※プレイヤーの削除が必要な場合は、Discordで「こにー」までご連絡ください。
        </Text>
      </VStack>
    </Layout>
  )
} 