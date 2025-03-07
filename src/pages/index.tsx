import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Button,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export default function Home() {
  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading>LoL Team Maker</Heading>
        <Text fontSize="xl" textAlign="center">
          League of Legendsのチーム自動振り分けツール
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} width="100%">
          <Card>
            <CardHeader>
              <Heading size="md">プレイヤー一覧</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>登録済みのプレイヤー一覧を表示します</Text>
              <Button as={RouterLink} to="/players" colorScheme="blue" width="100%">
                プレイヤー一覧へ
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">プレイヤー登録</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>新しいプレイヤーを登録します</Text>
              <Button as={RouterLink} to="/players/new" colorScheme="green" width="100%">
                プレイヤー登録へ
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">チーム作成</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>プレイヤーを選択してチームを自動振り分けします</Text>
              <Button as={RouterLink} to="/team-maker" colorScheme="purple" width="100%">
                チーム作成へ
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">試合履歴</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>過去の試合結果を確認できます</Text>
              <Button as={RouterLink} to="/matches" colorScheme="orange" width="100%">
                試合履歴へ
              </Button>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  )
} 