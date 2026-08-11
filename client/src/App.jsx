import { Routes, Route } from 'react-router-dom';

import  Layout from './components/Layout.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Accounts from './pages/Accounts.jsx';
import Transactions from './pages/Transactions.jsx';
import Budgets from './pages/Budgets.jsx';
import Investments from './pages/Investments.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function App() {
  return (
    <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/investments" element={<Investments />} />
    </Route>
      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

    </Routes>
  );
}

export default App;