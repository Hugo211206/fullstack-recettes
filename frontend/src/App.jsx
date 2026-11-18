import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RecipeDetail from './pages/RecipeDetail';
import RecipeEditor from './pages/RecipeEditor';
import RecipeList from './pages/RecipeList';
import Register from './pages/Register';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><RecipeList /></ProtectedRoute>} />
        <Route path="/recipes/new" element={<ProtectedRoute><RecipeEditor /></ProtectedRoute>} />
        <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
        <Route path="/recipes/:id/edit" element={<ProtectedRoute><RecipeEditor /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;