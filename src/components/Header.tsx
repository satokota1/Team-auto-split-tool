import { Box, Flex, Link, Heading } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export default function Header() {
  return (
    <Box bg="blue.500" px={4} py={3}>
      <Flex maxW="container.lg" mx="auto" align="center" justify="space-between">
        <Link as={RouterLink} to="/">
          <Heading size="md" color="white">
            LoL Team Maker
          </Heading>
        </Link>
        <Flex gap={4}>
          <Link as={RouterLink} to="/players" color="white">
            プレイヤー一覧
          </Link>
          <Link as={RouterLink} to="/players/new" color="white">
            プレイヤー登録
          </Link>
          <Link as={RouterLink} to="/team-maker" color="white">
            チーム作成
          </Link>
          <Link as={RouterLink} to="/matches" color="white">
            試合履歴
          </Link>
        </Flex>
      </Flex>
    </Box>
  )
} 