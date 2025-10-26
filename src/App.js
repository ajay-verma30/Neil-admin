import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login/Login';
import Organization from './Pages/Organization/Organization';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Dashboard from './Pages/Dashboard/Dashboard';
import CreateOrganization from './Pages/Organization/CreateOrganization';
import RegisterOrganization from './Register/RegisterOrganization';
import SpecificOrganization from './Pages/Organization/SpecificOrganization';
import Users from './Pages/Users/Users';
import { useContext } from 'react';
import SpecificUser from './Pages/Users/SpecificUser';
import NewUser from './Pages/Users/NewUser';
import Groups from './Pages/Groups/Groups';
import Products from './Pages/Products/Products';
import CreateProducts from './Pages/Products/CreateProducts';
import SubCategories from './Pages/SubCategories/SubCategories';
import SpecificProduct from './Pages/Products/SpecificProduct';

function AppRoutes() {
  const { user } = useContext(AuthContext);

  const isSuperAdmin = user?.role === 'Super Admin';

  return (
    <Routes>
      {/* Public Routes - always accessible */}
      <Route path='/' element={<Login />} />
      <Route path='/register_organization' element={<RegisterOrganization />} />

      {/* Super Admin Routes */}
      {isSuperAdmin && (
        <>
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/organizations'
            element={
              <ProtectedRoute>
                <Organization />
              </ProtectedRoute>
            }
          />
          <Route
            path='/new-organization'
            element={
              <ProtectedRoute>
                <CreateOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path='/organization/:id'
            element={
              <ProtectedRoute>
                <SpecificOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path='/users'
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path='/users/:id'
            element={
              <ProtectedRoute>
                <SpecificUser />
              </ProtectedRoute>
            }
          />
          <Route
            path='/users/new'
            element={
              <ProtectedRoute>
                <NewUser />
              </ProtectedRoute>
            }
          />
            <Route
            path='/groups'
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path='/products'
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path='/products/new'
            element={
              <ProtectedRoute>
                <CreateProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path='/sub_categories/new'
            element={
              <ProtectedRoute>
                <SubCategories />
              </ProtectedRoute>
            }
          />
                    <Route
            path='/products/:id'
            element={
              <ProtectedRoute>
                <SpecificProduct />
              </ProtectedRoute>
            }
          />
        </>
      )}

      {/* Admin / Manager Routes */}
      {user && user.role !== 'Super Admin' && (
        <>
          <Route
            path='/:org_id/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/users'
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/users/:id'
            element={
              <ProtectedRoute>
                <SpecificUser />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/users/new'
            element={
              <ProtectedRoute>
                <NewUser />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/groups'
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/organization_details'
            element={
              <ProtectedRoute>
                <SpecificOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/products'
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/orders'
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/products/new'
            element={
              <ProtectedRoute>
                <CreateProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/sub_categories/new'
            element={
              <ProtectedRoute>
                <SubCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:org_id/products/:id'
            element={
              <ProtectedRoute>
                <SpecificProduct />
              </ProtectedRoute>
            }
          />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
