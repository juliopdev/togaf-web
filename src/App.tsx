import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import AdmPage from './pages/AdmPage'
import ExamPage from './pages/ExamPage'
import FlashcardsPage from './pages/FlashcardsPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import PhasePage from './pages/PhasePage'
import PracticePage from './pages/PracticePage'
import ProgressPage from './pages/ProgressPage'
import TopicPage from './pages/TopicPage'
import TopicsPage from './pages/TopicsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="adm" element={<AdmPage />} />
        <Route path="fases/:id" element={<PhasePage />} />
        <Route path="teoria" element={<TopicsPage />} />
        <Route path="teoria/:id" element={<TopicPage />} />
        <Route path="tarjetas" element={<FlashcardsPage />} />
        <Route path="practica" element={<PracticePage />} />
        <Route path="simulacro" element={<ExamPage />} />
        <Route path="progreso" element={<ProgressPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
