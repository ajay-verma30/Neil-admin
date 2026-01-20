import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../src/context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Auth & Public Pages
import Login from './Login/Login';
import RegisterOrganization from './Register/RegisterOrganization';
import PasswordReset from './Login/PasswordReset';
import Unauthorized from './Pages/Unauthorized/Unauthorized'; 

// Admin/Dashboard Pages
import Dashboard from './Pages/Dashboard/Dashboard';
import Organization from './Pages/Organization/Organization';
import CreateOrganization from './Pages/Organization/CreateOrganization';
import SpecificOrganization from './Pages/Organization/SpecificOrganization';
import Users from './Pages/Users/Users';
import SpecificUser from './Pages/Users/SpecificUser';
import NewUser from './Pages/Users/NewUser';
import Groups from './Pages/Groups/Groups';
import SpecGroup from './Pages/Groups/SpecGroup';
import Products from './Pages/Products/Products';
import CreateProducts from './Pages/Products/CreateProducts';
import Categories from './Pages/SubCategories/Categories';
import SubCategories from './Pages/SubCategories/SubCategories';
import SpecificProduct from './Pages/Products/SpecificProduct';
import Logos from './Pages/Logos/Logos';
import CreateLogos from './Pages/Logos/CreateLogos';
import FullOrders from './Pages/Orders/Orders';
import SpecificOrder from './Pages/Orders/SpecificOrder';
import Customize from './Pages/Organization/Customize';
import CustomizeProduct from './Pages/Products/CustomizeProduct';
import Coupons from './Pages/Coupons/Coupons';
import SpecCoupon from './Pages/Coupons/SpecCoupon';
import MyProfile1 from './Pages/Users/MyProfile';

// User Specific Pages
import UserProducts from './Users/UserProducts';
import UserProduct from './Users/UserProduct';
import Cart from './Users/Cart';
import Orders from './Users/Orders';
import MyProfile from './Users/MyProfile';
import PaymentPage from './Pages/Users/PaymentPage';
import Wallet from './Pages/Wallet/Wallet';

// Context & Helpers
import ModePrompt from './context/ModePrompt'; 
import { AllProviders } from './context/AllProviders';

const stripePromise = loadStripe("pk_test_51STDSEJ0pzVuvwN7FVivbYOUDiwKnNISai4iOAGwdG4CiQspWZYDpQpdMXErA06gPKLRx8jZ2QCdU1oUDWwZ5X4A002VPrPgZ5");

function AppRoutes() {
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path='/' element={<UserProducts />} />
      <Route path='/login' element={<Login />} /> 
      <Route path='/register_organization' element={<RegisterOrganization />} />
      <Route path='/reset-password' element={<PasswordReset />}/>
      <Route path='/products/:id' element={<UserProduct />} />
      <Route path='/unauthorized' element={<Unauthorized />} />

      {/* ---------- SUPER ADMIN ROUTES ---------- */}
      {/* Humne condition hata di hai taaki ProtectedRoute unauthorized access pakad sake */}
      <Route path='/admin/dashboard' element={<ProtectedRoute allowedRoles={['Super Admin']}><Dashboard /></ProtectedRoute>} />
      <Route path='/admin/organizations' element={<ProtectedRoute allowedRoles={['Super Admin']}><Organization /></ProtectedRoute>} />
      <Route path='/admin/new-organization' element={<ProtectedRoute allowedRoles={['Super Admin']}><CreateOrganization /></ProtectedRoute>} />
      <Route path='/admin/organization/:id' element={<ProtectedRoute allowedRoles={['Super Admin']}><SpecificOrganization /></ProtectedRoute>} />
      <Route path='/admin/organization/:id/customize' element={<ProtectedRoute allowedRoles={['Super Admin']}><Customize /></ProtectedRoute>} />
      <Route path='/admin/users' element={<ProtectedRoute allowedRoles={['Super Admin']}><Users /></ProtectedRoute>} />
      <Route path='/admin/users/:id' element={<ProtectedRoute allowedRoles={['Super Admin']}><SpecificUser /></ProtectedRoute>} />
      <Route path='/admin/users/new' element={<ProtectedRoute allowedRoles={['Super Admin']}><NewUser /></ProtectedRoute>} />
      <Route path='/admin/groups' element={<ProtectedRoute allowedRoles={['Super Admin']}><Groups /></ProtectedRoute>} />
      <Route path='/admin/groups/:id' element={<ProtectedRoute allowedRoles={['Super Admin']}><SpecGroup /></ProtectedRoute>} />
      <Route path='/admin/products' element={<ProtectedRoute allowedRoles={['Super Admin']}><Products /></ProtectedRoute>} />
      <Route path='/admin/products/new' element={<ProtectedRoute allowedRoles={['Super Admin']}><CreateProducts /></ProtectedRoute>} />
      <Route path='/admin/categories' element={<ProtectedRoute allowedRoles={['Super Admin']}><Categories /></ProtectedRoute>} />
      <Route path='/admin/sub-categories' element={<ProtectedRoute allowedRoles={['Super Admin']}><SubCategories /></ProtectedRoute>} />
      <Route path='/admin/products/:id' element={<ProtectedRoute allowedRoles={['Super Admin']}><SpecificProduct /></ProtectedRoute>} />
      <Route path='/admin/products/:id/customize' element={<ProtectedRoute allowedRoles={['Super Admin']}><CustomizeProduct/></ProtectedRoute>} />
      <Route path='/admin/logos' element={<ProtectedRoute allowedRoles={['Super Admin']}><Logos /></ProtectedRoute>} />
      <Route path='/admin/logos/new-logo' element={<ProtectedRoute allowedRoles={['Super Admin']}><CreateLogos /></ProtectedRoute>} />
      <Route path='/admin/orders' element={<ProtectedRoute allowedRoles={['Super Admin']}><FullOrders /></ProtectedRoute>} />
      <Route path='/admin/orders/:id' element={<ProtectedRoute allowedRoles={['Super Admin']}><SpecificOrder /></ProtectedRoute>} />
      <Route path='/admin/my-profile' element={<ProtectedRoute allowedRoles={['Super Admin']}><MyProfile1/></ProtectedRoute>}/>
      <Route path='/admin/coupons' element={<ProtectedRoute allowedRoles={['Super Admin']}><Coupons/></ProtectedRoute>}/>
      <Route path='/admin/coupons/:id' element={<ProtectedRoute allowedRoles={['Super Admin']}><SpecCoupon/></ProtectedRoute>}/>

      {/* ---------- ADMIN / MANAGER ROUTES ---------- */}
      <Route path='/:org_id/dashboard' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Dashboard /></ProtectedRoute>} />
      <Route path='/:org_id/users' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Users /></ProtectedRoute>} />
      <Route path='/:org_id/users/:id' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SpecificUser /></ProtectedRoute>} />
      <Route path='/:org_id/users/new' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><NewUser /></ProtectedRoute>} />
      <Route path='/:org_id/groups' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Groups /></ProtectedRoute>} />
      <Route path='/:org_id/groups/:id' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SpecGroup /></ProtectedRoute>} />
      <Route path='/:org_id/organization_details' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SpecificOrganization /></ProtectedRoute>} />
      <Route path='/:org_id/products' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Products /></ProtectedRoute>} />
      <Route path='/:org_id/products/new' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><CreateProducts /></ProtectedRoute>} />
      <Route path='/:org_id/categories' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Categories /></ProtectedRoute>} />
      <Route path='/:org_id/sub-categories' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SubCategories /></ProtectedRoute>} />
      <Route path='/:org_id/products/:id' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SpecificProduct /></ProtectedRoute>} />
      <Route path='/:org_id/logos' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Logos /></ProtectedRoute>} />
      <Route path='/:org_id/logos/new-logo' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><CreateLogos /></ProtectedRoute>} />
      <Route path='/:org_id/org_orders' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><FullOrders /></ProtectedRoute>} />
      <Route path='/:org_id/orders/:id' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SpecificOrder /></ProtectedRoute>} />
      <Route path='/:org_id/my-profile' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><MyProfile1/></ProtectedRoute>}/>
      <Route path='/:org_id/coupons' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Coupons/></ProtectedRoute>}/>
      <Route path='/:org_id/coupons/:id' element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SpecCoupon/></ProtectedRoute>}/>

      {/* ---------- COMMON PROTECTED ROUTES ---------- */}
      <Route path="/cart" element={<ProtectedRoute allowedRoles={["User", "Super Admin", "Admin", "Manager"]}><Cart /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute allowedRoles={["User", "Super Admin", "Admin", "Manager"]}><Orders /></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute allowedRoles={["User", "Super Admin", "Admin", "Manager"]}><MyProfile /></ProtectedRoute>} />
      <Route path="/my-wallet" element={<ProtectedRoute allowedRoles={["User", "Super Admin", "Admin", "Manager"]}><Wallet /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute allowedRoles={["User", "Super Admin", "Admin", "Manager"]}><PaymentPage /></ProtectedRoute>} />

      {/* Catch-all Route for 404 */}
      <Route path="*" element={<div className="p-5 text-center"><h1>404 - Page Not Found</h1></div>} />
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
      <AllProviders>
        <Elements stripe={stripePromise}>
          <Router>
            <AppContent />
          </Router>
        </Elements>
      </AllProviders>
    </div>
  );
}

export default App;