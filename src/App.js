import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthProvider, AuthContext } from '../src/context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './Login/Login';
import RegisterOrganization from './Register/RegisterOrganization';
import Dashboard from './Pages/Dashboard/Dashboard';
import Organization from './Pages/Organization/Organization';
import CreateOrganization from './Pages/Organization/CreateOrganization';
import SpecificOrganization from './Pages/Organization/SpecificOrganization';
import Users from './Pages/Users/Users';
import SpecificUser from './Pages/Users/SpecificUser';
import NewUser from './Pages/Users/NewUser';
import Groups from './Pages/Groups/Groups';
import Products from './Pages/Products/Products';
import CreateProducts from './Pages/Products/CreateProducts';
import SubCategories from './Pages/SubCategories/SubCategories';
import SpecificProduct from './Pages/Products/SpecificProduct';
import Logos from './Pages/Logos/Logos';
import CreateLogos from './Pages/Logos/CreateLogos';
import UserProducts from './Users/UserProducts';
import UserProduct from './Users/UserProduct';
import PasswordReset from './Login/PasswordReset';
import Cart from './Users/Cart';
import Orders from './Users/Orders';
import ModePrompt from './context/ModePrompt'; 
import FullOrders from './Pages/Orders/Orders'

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path='/' element={<Login />} />
      <Route path='/register_organization' element={<RegisterOrganization />} />
      <Route path='/reset-password' element={<PasswordReset />} />

      {/* ---------- SUPER ADMIN ROUTES ---------- */}
      {user?.role === 'Super Admin' && (
        <>
          <Route path='/admin/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/admin/organizations' element={<ProtectedRoute><Organization /></ProtectedRoute>} />
          <Route path='/admin/new-organization' element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
          <Route path='/admin/organization/:id' element={<ProtectedRoute><SpecificOrganization /></ProtectedRoute>} />
          <Route path='/admin/users' element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path='/admin/users/:id' element={<ProtectedRoute><SpecificUser /></ProtectedRoute>} />
          <Route path='/admin/users/new' element={<ProtectedRoute><NewUser /></ProtectedRoute>} />
          <Route path='/admin/groups' element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path='/admin/products' element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path='/admin/products/new' element={<ProtectedRoute><CreateProducts /></ProtectedRoute>} />
          <Route path='/admin/sub-categories' element={<ProtectedRoute><SubCategories /></ProtectedRoute>} />
          <Route path='/admin/products/:id' element={<ProtectedRoute><SpecificProduct /></ProtectedRoute>} />
          <Route path='/admin/logos' element={<ProtectedRoute><Logos /></ProtectedRoute>} />
          <Route path='/admin/logos/new-logo' element={<ProtectedRoute><CreateLogos /></ProtectedRoute>} />
          <Route path='/admin/orders' element={<ProtectedRoute><FullOrders /></ProtectedRoute>} />
        </>
      )}

      {/* ---------- ADMIN / MANAGER ROUTES ---------- */}
      {(user?.role === 'Admin' || user?.role === 'Manager') && (
        <>
          <Route path='/:org_id/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/:org_id/users' element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path='/:org_id/users/:id' element={<ProtectedRoute><SpecificUser /></ProtectedRoute>} />
          <Route path='/:org_id/users/new' element={<ProtectedRoute><NewUser /></ProtectedRoute>} />
          <Route path='/:org_id/groups' element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path='/:org_id/organization_details' element={<ProtectedRoute><SpecificOrganization /></ProtectedRoute>} />
          <Route path='/:org_id/products' element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path='/:org_id/orders' element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path='/:org_id/products/new' element={<ProtectedRoute><CreateProducts /></ProtectedRoute>} />
          <Route path='/:org_id/sub-categories' element={<ProtectedRoute><SubCategories /></ProtectedRoute>} />
          <Route path='/:org_id/products/:id' element={<ProtectedRoute><SpecificProduct /></ProtectedRoute>} />
          <Route path='/:org_id/logos' element={<ProtectedRoute><Logos /></ProtectedRoute>} />
          <Route path='/:org_id/logos/new-logo' element={<ProtectedRoute><CreateLogos /></ProtectedRoute>} />
        </>
      )}

      {/* ---------- USER ROUTES ---------- */}
      {["User", "Super Admin", "Admin", "Manager"].includes(user?.role) && (
        <>
          <Route path='/products' element={<ProtectedRoute><UserProducts /></ProtectedRoute>} />
          <Route path='/products/:id' element={<ProtectedRoute><UserProduct /></ProtectedRoute>} />
          <Route path='/cart' element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path='/orders' element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        </>
      )}
    </Routes>
  );
}

function AppContent() {
  const { user, mode } = useContext(AuthContext);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (user && ["Super Admin", "Admin", "Manager"].includes(user.role) && !mode) {
      const shown = sessionStorage.getItem("modePromptShown");
      if (!shown) {
        setShowPrompt(true);
        sessionStorage.setItem("modePromptShown", "true");
      }
    }
  }, [user, mode]);

  if (showPrompt) {
    return <ModePrompt onClose={() => setShowPrompt(false)} />;
  }

  return <AppRoutes />;
}

function App() {
  return (
    <div className='App'>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
