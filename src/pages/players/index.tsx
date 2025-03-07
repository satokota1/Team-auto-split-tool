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
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, GameRole } from '../../types'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Link from 'next/link'

export default function Players() {
  const [players, setPlayers] = useState<(Player & { id: string })[]>([])
  const tableBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

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
                </Tr>
              </Thead>
              <Tbody>
                {players.map((player) => {
                  const winRate = player.stats.wins + player.stats.losses > 0
                    ? Math.round((player.stats.wins / (player.stats.wins + player.stats.losses)) * 100)
                    : 0

                  return (
                    <Tr 
                      key={player.id}
                      _hover={{ bg: 'gray.50' }}
                      transition="background-color 0.2s"
                    >
                      <Td borderColor={borderColor}>{player.name}</Td>
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
                        <Text fontWeight="bold">
                          {player.rates[player.mainRole]}
                        </Text>
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