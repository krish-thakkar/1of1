// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import CompanyLogin from './pages/company/CompanyLogin';
import CompanyRegister from './pages/company/CompanyRegister';
import CompanyDashboard from './pages/company/CompanyDashboard';
import AddEmployee from './pages/company/AddEmployee';
import AssignTask from './pages/company/AssignTask';
import EmployeeLogin from './pages/employee/EmployeeLogin';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Roadmap from './pages/employee/Roadmap';
import PicPrompt from './pages/employee/PicPrompt';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Company Routes */}
          <Route path="/company/login" element={<CompanyLogin />} />
          <Route path="/company/register" element={<CompanyRegister />} />
          <Route path="/company" element={
            <PrivateRoute userType="company">
              <CompanyDashboard />
            </PrivateRoute>
          } />
          <Route path="/company/add-employee" element={
            <PrivateRoute userType="company">
              <AddEmployee />
            </PrivateRoute>
          } />
          <Route path="/company/assign-task" element={
            <PrivateRoute userType="company">
              <AssignTask />
            </PrivateRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee" element={
            <PrivateRoute userType="employee">
              <EmployeeDashboard />
            </PrivateRoute>
          } />
          <Route path="/employee/roadmap" element={
            <PrivateRoute userType="employee">
              <Roadmap/>
            </PrivateRoute>
          } />
          <Route path="/employee/picprompt" element={
            <PrivateRoute userType="employee">
              <PicPrompt/>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;