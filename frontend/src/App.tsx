import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CookieConsent from './components/CookieConsent';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Contact from './pages/Contact';
import CreateAntistic from './pages/CreateAntistic';
import AdminPanel from './pages/AdminPanel';
import ButtonShowcase from './pages/ButtonShowcase';
import TemplateShowcase from './components/TemplateShowcase';
import AnonymousTest from './components/AnonymousTest';
import ChartDataTest from './components/ChartDataTest';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Statistics from './pages/Statistics';
import CreateStatisticPage from './pages/CreateStatistic';
import StatisticDetailPage from './pages/StatisticDetail';
import AntisticDetailPage from './pages/AntisticDetail';
import WebsiteStatistics from './pages/admin/WebsiteStatistics';
import { trackPageView } from './utils/analytics';

// Component to track route changes
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track pageview on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
          <Navbar />
          <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/antistics/:slug" element={<AntisticDetailPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/statistics/:slug" element={<StatisticDetailPage />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/admin/statistics" element={<WebsiteStatistics />} />
            <Route path="/admin/statistics/create" element={<CreateStatisticPage />} />
            <Route path="/create" element={<CreateAntistic />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/buttons" element={<ButtonShowcase />} />
            <Route path="/templates" element={<TemplateShowcase />} />
            <Route path="/test-anonymous" element={<AnonymousTest />} />
            <Route path="/test-charts" element={<ChartDataTest />} />
          </Routes>
          <CookieConsent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
