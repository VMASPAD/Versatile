import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ads from './pages/Ads';
import AdEditor from './pages/AdEditor';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import BioProfile from './pages/BioProfile';
import FlyList from './pages/FlyList';
import FlyEditor from './pages/FlyEditor';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/ads/new" element={<AdEditor />} />
            <Route path="/ads/:id" element={<AdEditor />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics/:id" element={<Analytics />} />
            <Route path="/bio" element={<BioProfile />} />
            <Route path="/fly" element={<FlyList />} />
            <Route path="/fly/new" element={<FlyEditor />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
