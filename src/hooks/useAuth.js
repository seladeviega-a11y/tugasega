import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};

// Mock user for demo
export const getMockUser = () => ({
  id: '1',
  name: 'Ega Selaclevi',
  role: 'operator',
  employee_id: 'OP-033',
  email: 'operator@demo.com'
});