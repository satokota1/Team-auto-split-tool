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
  Grid,
  GridItem,
} from '@chakra-ui/react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Player, Role, Rank, RANK_RATES, GameRole } from '../../types'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Card from '../../components/Card'

export default function NewPlayer() {
  const [name, setName] = useState('')
  const [mainRole, setMainRole] = useState<GameRole>('TOP')
  const [roleRanks, setRoleRanks] = useState<{ [key in GameRole]: Rank }>({
    TOP: 'UNRANKED',
    JUNGLE: 'UNRANKED',
    MID: 'UNRANKED',
    ADC: 'UNRANKED',
    SUP: 'UNRANKED',
  })
  const toast = useToast()
  const router = useRouter()

  // メインロールが変更されたときの処理
  const handleMainRoleChange = (newMainRole: GameRole) => {
    setMainRole(newMainRole)
    
    // 現在のメインロールのランクを取得
    const currentMainRoleRank = roleRanks[newMainRole]
    if (currentMainRoleRank !== 'UNRANKED') {
      // 他のロールのランクを自動調整
      const ranks = Object.keys(RANK_RATES) as Rank[]
      const rankIndex = ranks.indexOf(currentMainRoleRank)
      const lowerRank = rankIndex > 0 ? ranks[rankIndex - 1] : currentMainRoleRank

      const newRoleRanks = { ...roleRanks }
      Object.keys(newRoleRanks).forEach((role) => {
        if (role !== newMainRole && newRoleRanks[role as GameRole] === 'UNRANKED') {
          newRoleRanks[role as GameRole] = lowerRank
        }
      })
      setRoleRanks(newRoleRanks)
    }
  }

  // ロールのランクが変更されたときに他のロールのランクを自動調整
  const handleRankChange = (role: GameRole, rank: Rank) => {
    const newRoleRanks = { ...roleRanks, [role]: rank }

    // メインロールのランクが変更された場合、他のロールのランクを自動調整
    if (role === mainRole && rank !== 'UNRANKED') {
      const ranks = Object.keys(RANK_RATES) as Rank[]
      const rankIndex = ranks.indexOf(rank)
      const lowerRank = rankIndex > 0 ? ranks[rankIndex - 1] : rank

      Object.keys(newRoleRanks).forEach((r) => {
        if (r !== role) {
          newRoleRanks[r as GameRole] = lowerRank
        }
      })
    }

    setRoleRanks(newRoleRanks)
  }

  // レートを計算
  const calculateRates = () => {
    const rates: { [key in GameRole]: number } = {} as { [key in GameRole]: number }
    Object.entries(roleRanks).forEach(([role, rank]) => {
      rates[role as GameRole] = role === mainRole ? 
        RANK_RATES[rank].main : 
        RANK_RATES[rank].sub
    })
    return rates
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !mainRole) {
      toast({
        title: 'エラー',
        description: '名前とメインロールを入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 確認ダイアログを表示
    if (!window.confirm(`以下の内容で登録しますか？\n\n名前: ${name}\nメインロール: ${mainRole}`)) {
      return
    }

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
    <Layout>
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center" color="blue.600" fontSize={{ base: '2xl', md: '3xl' }}>
          プレイヤー登録
        </Heading>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Stack spacing={6}>
            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">名前</FormLabel>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  size="lg"
                  borderRadius="md"
                  placeholder="FAKER#JP1"
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
                />
              </FormControl>
            </Card>

            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">メインロール</FormLabel>
                <Select 
                  value={mainRole} 
                  onChange={(e) => handleMainRoleChange(e.target.value as GameRole)}
                  size="lg"
                  borderRadius="md"
                >
                  {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Card>

            <Card>
              <FormLabel fontWeight="bold" mb={4}>ロール別ランク</FormLabel>
              <Grid 
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                gap={4}
              >
                {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'] as GameRole[]).map((role) => (
                  <GridItem key={role}>
                    <Card
                      bg={role === mainRole ? 'blue.50' : 'white'}
                      border="1px solid"
                      borderColor={role === mainRole ? 'blue.200' : 'gray.200'}
                    >
                      <FormControl>
                        <FormLabel>
                          {role}
                          {role === mainRole && (
                            <Text as="span" color="blue.500" ml={2} fontWeight="bold">
                              (メイン)
                            </Text>
                          )}
                        </FormLabel>
                        <Select
                          value={roleRanks[role]}
                          onChange={(e) => handleRankChange(role, e.target.value as Rank)}
                          size="md"
                        >
                          {Object.keys(RANK_RATES).map((rank) => (
                            <option key={rank} value={rank}>
                              {rank}
                            </option>
                          ))}
                        </Select>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          レート: {role === mainRole ? 
                            RANK_RATES[roleRanks[role]].main : 
                            RANK_RATES[roleRanks[role]].sub}
                        </Text>
                      </FormControl>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            </Card>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="full"
              boxShadow="md"
              isDisabled={!name.trim() || !mainRole}
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
            >
              登録
            </Button>
          </Stack>
        </form>
      </VStack>
    </Layout>
  )
} 