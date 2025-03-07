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

        <Box overflowX="auto" width="100%">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>名前</Th>
                <Th>メインロール</Th>
                <Th>勝利数</Th>
                <Th>敗北数</Th>
                <Th>勝率</Th>
              </Tr>
            </Thead>
            <Tbody>
              {players.map((player) => (
                <Tr key={player.id}>
                  <Td>{player.name}</Td>
                  <Td>{player.mainRole}</Td>
                  <Td>{player.stats.wins}</Td>
                  <Td>{player.stats.losses}</Td>
                  <Td>
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