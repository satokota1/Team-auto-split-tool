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
  useToast,
} from '@chakra-ui/react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, Rank, RANK_RATES } from '../../types'
import { useRouter } from 'next/router'

export default function NewPlayer() {
  const [name, setName] = useState('')
  const [mainRole, setMainRole] = useState<Role>('TOP')
  const [rank, setRank] = useState<Rank>('UNRANK')
  const [rates, setRates] = useState<{ [key in Role]: number }>({
    TOP: 0,
    JUNGLE: 0,
    MID: 0,
    ADC: 0,
    SUP: 0,
  })
  const toast = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const player: Omit<Player, 'id'> = {
        name,
        mainRole,
        rates,
        stats: {
          wins: 0,
          losses: 0,
        },
      }

      await addDoc(collection(db, 'players'), player)

      toast({
        title: '登録完了',
        description: 'プレイヤーを登録しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      router.push('/')
    } catch (error) {
      console.error('Error adding player:', error)
      toast({
        title: 'エラー',
        description: 'プレイヤーの登録に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleRateChange = (role: Role, value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) return

    setRates((prev) => ({
      ...prev,
      [role]: numValue,
    }))
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>プレイヤー登録</Heading>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>名前</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>メインロール</FormLabel>
              <Select value={mainRole} onChange={(e) => setMainRole(e.target.value as Role)}>
                {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'].map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>ランク</FormLabel>
              <Select value={rank} onChange={(e) => setRank(e.target.value as Rank)}>
                {Object.keys(RANK_RATES).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Box>
              <FormLabel>ロール別レート</FormLabel>
              <Stack spacing={2}>
                {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'].map((role) => (
                  <FormControl key={role}>
                    <FormLabel>{role}</FormLabel>
                    <Input
                      type="number"
                      value={rates[role as Role]}
                      onChange={(e) => handleRateChange(role as Role, e.target.value)}
                    />
                  </FormControl>
                ))}
              </Stack>
            </Box>

            <Button type="submit" colorScheme="blue">
              登録
            </Button>
          </Stack>
        </form>
      </VStack>
    </Container>
  )
} 