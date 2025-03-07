import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages'
import NewPlayer from './pages/players/new'
import Players from './pages/players'
import TeamMaker from './pages/team-maker'
import Matches from './pages/matches'

export default function App() {
  return (
    <ChakraProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/new" element={<NewPlayer />} />
          <Route path="/team-maker" element={<TeamMaker />} />
          <Route path="/matches" element={<Matches />} />
        </Routes>
      </Router>
    </ChakraProvider>
  )
} 