import { Box, Button, Container, Heading, Stack, VStack } from '@chakra-ui/react'
import Link from 'next/link'

export default function Home() {
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>LoL Team Maker</Heading>
        <Stack spacing={4} width="100%">
          <Link href="/players/new" passHref>
            <Button colorScheme="blue" size="lg">
              プレイヤー新規登録
            </Button>
          </Link>
          <Link href="/players" passHref>
            <Button colorScheme="green" size="lg">
              プレイヤー一覧
            </Button>
          </Link>
          <Link href="/matches" passHref>
            <Button colorScheme="purple" size="lg">
              試合履歴
            </Button>
          </Link>
          <Link href="/team-maker" passHref>
            <Button colorScheme="orange" size="lg">
              チーム自動振り分け
            </Button>
          </Link>
        </Stack>
      </VStack>
    </Container>
  )
} 