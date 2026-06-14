import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import TopBanner from './components/TopBanner';
import CommunityBanner from './components/CommunityBanner';
import Home from './pages/Home';
import StudyPlanner from './pages/StudyPlanner';
import Pomodoro from './pages/Pomodoro';
import StudyTools from './pages/StudyTools';
import ContactUs from './pages/ContactUs';
// Login removed
import NotFound from './pages/NotFound';
import SlapButton from './components/SlapButton';

function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <TopBanner />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/tools" element={<StudyTools />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <CommunityBanner />
        <SlapButton />
      </div>
    </AuthProvider>
  );
}

export default App;
