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
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  InputGroup,
  InputRightElement,
  Checkbox,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player, Role, Rank, RANK_RATES, GameRole } from '@/types'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Card from '@/components/Card'

// 利用可能なタグオプション
const AVAILABLE_TAGS = ['249', 'SHIFT', 'きらくに']

export default function NewPlayer() {
  const [name, setName] = useState('')
  const [mainRole, setMainRole] = useState<GameRole>(GameRole.TOP)
  const [mainRank, setMainRank] = useState<Rank>('UNRANKED')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const toast = useToast()
  const router = useRouter()

  // メインロールが変更されたときの処理
  const handleMainRoleChange = (newMainRole: GameRole) => {
    setMainRole(newMainRole)
  }

  // レートを計算
  const calculateRates = () => {
    const mainRate = RANK_RATES[mainRank].main
    const subRate = RANK_RATES[mainRank].sub
    return { mainRate, subRate }
  }

  // タグの選択/解除
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !mainRole || !mainRank || selectedTags.length === 0) {
      toast({
        title: 'エラー',
        description: '名前、メインロール、タグを入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 確認ダイアログを表示
    if (!window.confirm(`以下の内容で登録しますか？\n\n名前: ${name}\nメインロール: ${mainRole}\nタグ: ${selectedTags.join(', ')}`)) {
      return
    }

    try {
      const rates = calculateRates()
      const player: Omit<Player, 'id'> = {
        name,
        mainRole,
        mainRate: rates.mainRate,
        subRate: rates.subRate,
        stats: {
          wins: 0,
          losses: 0,
        },
        tags: selectedTags,
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
                  {Object.values(GameRole).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Card>

            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">ランク</FormLabel>
                <Select 
                  value={mainRank} 
                  onChange={(e) => setMainRank(e.target.value as Rank)}
                  size="lg"
                  borderRadius="md"
                >
                  {Object.keys(RANK_RATES).map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </Select>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  メインロールレート: {RANK_RATES[mainRank].main} | サブロールレート: {RANK_RATES[mainRank].sub}
                </Text>
              </FormControl>
            </Card>

            <Card>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">タグ</FormLabel>
                <Wrap spacing={3} mt={2}>
                  {AVAILABLE_TAGS.map((tag) => (
                    <WrapItem key={tag}>
                      <Checkbox
                        isChecked={selectedTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        colorScheme="blue"
                        size="lg"
                      >
                        <Tag
                          size="lg"
                          borderRadius="full"
                          variant={selectedTags.includes(tag) ? "solid" : "outline"}
                          colorScheme="blue"
                        >
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      </Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  よく遊ぶメンバーや特徴をタグで管理できます（必須）
                </Text>
              </FormControl>
            </Card>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="full"
              boxShadow="md"
              isDisabled={!name.trim() || !mainRole || !mainRank || selectedTags.length === 0}
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