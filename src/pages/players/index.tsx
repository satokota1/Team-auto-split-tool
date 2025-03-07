import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stack,
  VStack,
} from '@chakra-ui/react'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player } from '../../types'
import Link from 'next/link'

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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'players', id))
      setPlayers(players.filter((player) => player.id !== id))
    } catch (error) {
      console.error('Error deleting player:', error)
    }
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Stack direction="row" justify="space-between" width="100%">
          <Heading>プレイヤー一覧</Heading>
          <Link href="/players/new" passHref>
            <Button colorScheme="blue">新規登録</Button>
          </Link>
        </Stack>

        <Box overflowX="auto" width="100%">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>プレイヤー名</Th>
                <Th>メインロール</Th>
                <Th>勝敗数</Th>
                <Th>勝率</Th>
                <Th>メインレート</Th>
                <Th>サブレート</Th>
                <Th>操作</Th>
              </Tr>
            </Thead>
            <Tbody>
              {players.map((player) => (
                <Tr key={player.id}>
                  <Td>{player.name}</Td>
                  <Td>{player.mainRole}</Td>
                  <Td>
                    {player.stats.wins}勝{player.stats.losses}敗
                  </Td>
                  <Td>
                    {player.stats.wins + player.stats.losses > 0
                      ? Math.round(
                          (player.stats.wins /
                            (player.stats.wins + player.stats.losses)) *
                            100
                        )
                      : 0}
                    %
                  </Td>
                  <Td>{player.rates[player.mainRole]}</Td>
                  <Td>
                    {Math.min(
                      ...Object.entries(player.rates)
                        .filter(([role]) => role !== player.mainRole)
                        .map(([, rate]) => rate)
                    )}
                  </Td>
                  <Td>
                    <Button
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDelete(player.id)}
                    >
                      削除
                    </Button>
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