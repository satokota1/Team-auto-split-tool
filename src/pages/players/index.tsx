import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  Text,
} from '@chakra-ui/react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player } from '../../types'

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([])

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

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading>プレイヤー一覧</Heading>

        <Text color="gray.600" fontSize="sm">
          ※プレイヤーの削除が必要な場合は、Discordで「こにー」まで連絡を！！
        </Text>

        <Box overflowX="auto" width="100%">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>名前</Th>
                <Th>メインロール</Th>
                <Th isNumeric>TOP</Th>
                <Th isNumeric>JG</Th>
                <Th isNumeric>MID</Th>
                <Th isNumeric>ADC</Th>
                <Th isNumeric>SUP</Th>
                <Th isNumeric>勝利</Th>
                <Th isNumeric>敗北</Th>
                <Th isNumeric>勝率</Th>
              </Tr>
            </Thead>
            <Tbody>
              {players.map((player) => (
                <Tr key={player.id}>
                  <Td fontWeight="bold">{player.name}</Td>
                  <Td color="blue.500" fontWeight="semibold">{player.mainRole}</Td>
                  <Td isNumeric>{player.rates.TOP}</Td>
                  <Td isNumeric>{player.rates.JUNGLE}</Td>
                  <Td isNumeric>{player.rates.MID}</Td>
                  <Td isNumeric>{player.rates.ADC}</Td>
                  <Td isNumeric>{player.rates.SUP}</Td>
                  <Td isNumeric color="green.500" fontWeight="semibold">{player.stats.wins}</Td>
                  <Td isNumeric color="red.500" fontWeight="semibold">{player.stats.losses}</Td>
                  <Td isNumeric fontWeight="bold">
                    {player.stats.wins + player.stats.losses > 0
                      ? `${Math.round(
                          (player.stats.wins /
                            (player.stats.wins + player.stats.losses)) *
                            100
                        )}%`
                      : '-'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Container>
  )
} 