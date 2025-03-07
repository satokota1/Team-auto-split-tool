import { useState, useEffect } from 'react'
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
  Text,
} from '@chakra-ui/react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, Rank, RANK_RATES } from '../../types'
import { useRouter } from 'next/router'

export default function NewPlayer() {
  const [name, setName] = useState('')
  const [mainRole, setMainRole] = useState<Role>('TOP')
  const [roleRanks, setRoleRanks] = useState<{ [key in Role]: Rank }>({
    TOP: 'UNRANK',
    JUNGLE: 'UNRANK',
    MID: 'UNRANK',
    ADC: 'UNRANK',
    SUP: 'UNRANK',
  })
  const toast = useToast()
  const router = useRouter()

  // ロールのランクが変更されたときに他のロールのランクを自動調整
  const handleRankChange = (role: Role, rank: Rank) => {
    const newRoleRanks = { ...roleRanks, [role]: rank }

    // UNRANKでないランクが設定されているかチェック
    const hasNonUnrank = Object.values(newRoleRanks).some(r => r !== 'UNRANK')
    if (hasNonUnrank) {
      // メインロール以外のランクを自動設定
      const ranks = Object.keys(RANK_RATES) as Rank[]
      const roleRank = newRoleRanks[role]
      if (roleRank !== 'UNRANK') {
        const rankIndex = ranks.indexOf(roleRank)
        const lowerRank = rankIndex > 0 ? ranks[rankIndex - 1] : roleRank
        
        Object.keys(newRoleRanks).forEach((r) => {
          if (r !== role && newRoleRanks[r as Role] === 'UNRANK') {
            newRoleRanks[r as Role] = lowerRank
          }
        })
      }
    }

    setRoleRanks(newRoleRanks)
  }

  // レートを計算
  const calculateRates = () => {
    const rates: { [key in Role]: number } = {} as { [key in Role]: number }
    Object.entries(roleRanks).forEach(([role, rank]) => {
      rates[role as Role] = role === mainRole ? 
        RANK_RATES[rank].main : 
        RANK_RATES[rank].sub
    })
    return rates
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const player: Omit<Player, 'id'> = {
        name,
        mainRole,
        rates: calculateRates(),
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

            <Box>
              <FormLabel>ロール別ランク</FormLabel>
              <Stack spacing={2}>
                {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'] as Role[]).map((role) => (
                  <FormControl key={role}>
                    <FormLabel>
                      {role}
                      {role === mainRole && (
                        <Text as="span" color="blue.500" ml={2}>
                          (メインロール)
                        </Text>
                      )}
                    </FormLabel>
                    <Select
                      value={roleRanks[role]}
                      onChange={(e) => handleRankChange(role, e.target.value as Rank)}
                    >
                      {Object.keys(RANK_RATES).map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </Select>
                    <Text fontSize="sm" color="gray.600">
                      レート: {role === mainRole ? 
                        RANK_RATES[roleRanks[role]].main : 
                        RANK_RATES[roleRanks[role]].sub}
                    </Text>
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