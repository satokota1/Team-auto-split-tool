import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Badge,
  Avatar,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  GridItem,
} from '@chakra-ui/react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { useState } from 'react'

// サンプルデータ（後でAPIから取得するように変更）
const rateHistoryData = [
  { date: '2024/03/01', rate: 1500 },
  { date: '2024/03/02', rate: 1520 },
  { date: '2024/03/03', rate: 1510 },
  { date: '2024/03/04', rate: 1535 },
  { date: '2024/03/05', rate: 1525 },
  { date: '2024/03/06', rate: 1550 },
  { date: '2024/03/07', rate: 1570 },
]

const roleData = [
  { role: 'TOP', winRate: 60, games: 20, avgRate: 1520 },
  { role: 'JG', winRate: 55, games: 15, avgRate: 1510 },
  { role: 'MID', winRate: 65, games: 25, avgRate: 1540 },
  { role: 'BOT', winRate: 58, games: 18, avgRate: 1530 },
  { role: 'SUP', winRate: 62, games: 22, avgRate: 1525 },
]

const playerStats = [
  {
    name: 'プレイヤー1',
    avatar: 'https://bit.ly/broken-link',
    currentRate: 1570,
    rateChange: 70,
    winRate: 62,
    bestRole: 'MID',
    recentGames: 10,
  },
  // 他のプレイヤーデータ...
]

const radarData = [
  {
    role: 'TOP',
    value: 60,
  },
  {
    role: 'JG',
    value: 55,
  },
  {
    role: 'MID',
    value: 65,
  },
  {
    role: 'BOT',
    value: 58,
  },
  {
    role: 'SUP',
    value: 62,
  },
]

export default function RatingHistory() {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box bg="gray.50" minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="2xl" color="blue.600" mb={4}>
              レート変動ランキング
            </Heading>
            <Text fontSize="lg" color="gray.600">
              プレイヤーのレート推移と詳細な統計情報を確認できます
            </Text>
          </Box>

          <Grid templateColumns={{ base: 'repeat(1, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
            {playerStats.map((player, index) => (
              <GridItem key={index}>
                <Card>
                  <CardBody>
                    <HStack spacing={4}>
                      <Avatar name={player.name} src={player.avatar} size="lg" />
                      <Box flex="1">
                        <Heading size="md">{player.name}</Heading>
                        <HStack mt={2}>
                          <Badge colorScheme="purple">Rate: {player.currentRate}</Badge>
                          <Badge colorScheme={player.rateChange >= 0 ? 'green' : 'red'}>
                            {player.rateChange >= 0 ? '+' : ''}{player.rateChange}
                          </Badge>
                        </HStack>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>

          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="lg">レート推移</Heading>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  width="200px"
                >
                  <option value="week">過去1週間</option>
                  <option value="month">過去1ヶ月</option>
                  <option value="all">全期間</option>
                </Select>
              </HStack>
            </CardHeader>
            <CardBody>
              <Box height="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rateHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab>ロール別成績</Tab>
              <Tab>勝率分布</Tab>
              <Tab>総合評価</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap={6}>
                  <GridItem>
                    <Card>
                      <CardHeader>
                        <Heading size="md">ロール別勝率</Heading>
                      </CardHeader>
                      <CardBody>
                        <Box height="300px">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={roleData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="role" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="winRate" fill="#8884d8" name="勝率" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardBody>
                    </Card>
                  </GridItem>

                  <GridItem>
                    <Card>
                      <CardHeader>
                        <Heading size="md">ロールバランス</Heading>
                      </CardHeader>
                      <CardBody>
                        <Box height="300px">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="role" />
                              <PolarRadiusAxis />
                              <Radar
                                name="プレイヤー"
                                dataKey="value"
                                stroke="#8884d8"
                                fill="#8884d8"
                                fillOpacity={0.6}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              </TabPanel>

              <TabPanel>
                <Card>
                  <CardBody>
                    <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(5, 1fr)' }} gap={4}>
                      {roleData.map((role, index) => (
                        <GridItem key={index}>
                          <Stat>
                            <StatLabel>{role.role}</StatLabel>
                            <StatNumber>{role.winRate}%</StatNumber>
                            <StatHelpText>
                              <StatArrow type={role.winRate >= 50 ? 'increase' : 'decrease'} />
                              {role.games}試合
                            </StatHelpText>
                          </Stat>
                        </GridItem>
                      ))}
                    </Grid>
                  </CardBody>
                </Card>
              </TabPanel>

              <TabPanel>
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">総合評価</Heading>
                      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6}>
                        <GridItem>
                          <Stat>
                            <StatLabel>平均レート</StatLabel>
                            <StatNumber>1530</StatNumber>
                            <StatHelpText>
                              <StatArrow type="increase" />
                              +30 (過去30日)
                            </StatHelpText>
                          </Stat>
                        </GridItem>
                        <GridItem>
                          <Stat>
                            <StatLabel>総試合数</StatLabel>
                            <StatNumber>100</StatNumber>
                            <StatHelpText>直近30日: 25試合</StatHelpText>
                          </Stat>
                        </GridItem>
                        <GridItem>
                          <Stat>
                            <StatLabel>最高レート</StatLabel>
                            <StatNumber>1570</StatNumber>
                            <StatHelpText>2024/03/07達成</StatHelpText>
                          </Stat>
                        </GridItem>
                      </Grid>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  )
} 