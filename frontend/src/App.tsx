import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateAntistic from './pages/CreateAntistic';
import AdminPanel from './pages/AdminPanel';
import ButtonShowcase from './pages/ButtonShowcase';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create" element={<CreateAntistic />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/buttons" element={<ButtonShowcase />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
