import { useState } from 'react'
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
} from '@chakra-ui/react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, Rank, RANK_RATES } from '../../types'

export default function NewPlayer() {
  const [name, setName] = useState('')
  const [mainRole, setMainRole] = useState<Role>('TOP')
  const [rates, setRates] = useState<{ [key in Role]: Rank }>({
    TOP: 'UNRANK',
    JUNGLE: 'UNRANK',
    MID: 'UNRANK',
    ADC: 'UNRANK',
    SUP: 'UNRANK',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const player: Omit<Player, 'id'> = {
      name,
      mainRole,
      rates: Object.entries(rates).reduce((acc, [role, rank]) => ({
        ...acc,
        [role]: role === mainRole ? RANK_RATES[rank].main : RANK_RATES[rank].sub,
      }), {} as { [key in Role]: number }),
      stats: {
        wins: 0,
        losses: 0,
      },
    }

    try {
      await addDoc(collection(db, 'players'), player)
      // 登録成功後の処理（例：ホームページにリダイレクト）
    } catch (error) {
      console.error('Error adding player:', error)
    }
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>プレイヤー新規登録</Heading>
        <Box as="form" onSubmit={handleSubmit} width="100%">
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>プレイヤー名</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="プレイヤー名を入力"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>メインロール</FormLabel>
              <Select
                value={mainRole}
                onChange={(e) => setMainRole(e.target.value as Role)}
              >
                {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'].map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </FormControl>

            {Object.entries(rates).map(([role, rank]) => (
              <FormControl key={role}>
                <FormLabel>{role}のランク</FormLabel>
                <Select
                  value={rank}
                  onChange={(e) =>
                    setRates({ ...rates, [role]: e.target.value as Rank })
                  }
                >
                  {Object.keys(RANK_RATES).map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </Select>
              </FormControl>
            ))}

            <Button type="submit" colorScheme="blue">
              登録
            </Button>
          </Stack>
        </Box>
      </VStack>
    </Container>
  )
} 