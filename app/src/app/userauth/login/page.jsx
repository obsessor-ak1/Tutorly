import { loginStatus } from '@/lib/userauth';
import LoginForm from '@/components/LoginForm'; // Move your current client code here

export default async function LoginPage() {
  // If the user is already logged in, redirect them away from the login page
  await loginStatus(false);

  return <LoginForm />;
}