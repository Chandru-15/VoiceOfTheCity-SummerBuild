import { BrowserRouter, Routes, Route } from 'react-router'
import { AuthProvider } from './context/AuthContext.jsx'
import HomePage from './Pages/1-HomePage/HomePage'
import SubmitReport from './Pages/2-SubmitReportPage/SubmitReportPage'
import AdminRoute from './components/AdminRoute.jsx'
import ViewReportsUser from './Pages/4-ViewReports-User/ViewReportsUser'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submit" element={<SubmitReport />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/viewreports" element={<ViewReportsUser />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App