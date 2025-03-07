import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  VStack,
  Badge,
  useColorModeValue,
  Input,
  IconButton,
  useToast,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, GameRole } from '../../types'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Link from 'next/link'

interface EditingState {
  id: string | null;
  newName: string;
  newRate?: number;
}

export default function Players() {
  const [players, setPlayers] = useState<(Player & { id: string })[]>([])
  const [editing, setEditing] = useState<EditingState>({ id: null, newName: '' })
  const tableBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const toast = useToast()

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, 'players'))
      const playersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
      newName: player.name,
      newRate: player.rates[player.mainRole]
    })
  }

  const handleCancelEdit = () => {
    setEditing({ id: null, newName: '', newRate: undefined })
  }

  const handleSaveEdit = async (playerId: string, player: Player & { id: string }) => {
    if (!editing.newName.trim()) {
      toast({
        title: 'エラー',
        description: '名前を入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (editing.newRate === undefined || isNaN(editing.newRate)) {
      toast({
        title: 'エラー',
        description: 'レートを入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const playerRef = doc(db, 'players', playerId)
      const updatedRates = { ...player.rates }
      updatedRates[player.mainRole] = editing.newRate

      await updateDoc(playerRef, {
        name: editing.newName.trim(),
        rates: updatedRates
      })

      setPlayers(players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              name: editing.newName.trim(),
              rates: updatedRates
            }
          : p
      ))

      setEditing({ id: null, newName: '', newRate: undefined })

      toast({
        title: '更新完了',
        description: 'プレイヤー情報を更新しました',
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

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
            『プレイヤー』一覧
          </Heading>
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

        <Card p={0}>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th borderColor={borderColor}>名前</Th>
                  <Th borderColor={borderColor}>メインロール</Th>
                  <Th borderColor={borderColor} isNumeric>勝率</Th>
                  <Th borderColor={borderColor} isNumeric>レート</Th>
                  <Th borderColor={borderColor} width="100px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {players.map((player) => {
                  const winRate = player.stats.wins + player.stats.losses > 0
                    ? Math.round((player.stats.wins / (player.stats.wins + player.stats.losses)) * 100)
                    : 0

                  const isEditing = editing.id === player.id

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
                      <Td borderColor={borderColor} isNumeric>
                        {isEditing ? (
                          <Input
                            value={editing.newRate ?? ''}
                            onChange={(e) => setEditing({ 
                              ...editing, 
                              newRate: parseInt(e.target.value) || undefined 
                            })}
                            size="sm"
                            width="100px"
                            type="number"
                            textAlign="right"
                          />
                        ) : (
                          <Text fontWeight="bold">
                            {player.rates[player.mainRole]}
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
                                onClick={() => handleSaveEdit(player.id, player)}
                              />
                              <IconButton
                                aria-label="Cancel"
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleCancelEdit}
                              />
                            </>
                          ) : (
                            <IconButton
                              aria-label="Edit"
                              icon={<EditIcon />}
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleEditClick(player)}
                            />
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