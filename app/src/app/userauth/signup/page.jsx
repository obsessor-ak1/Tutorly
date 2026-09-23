import { loginStatus } from '@/lib/userauth';
import SignupForm from '@/components/SignupForm'; // Move your current client code here

export default async function LoginPage() {
  // If the user is already logged in, redirect them away from the login page
  await loginStatus(false);

  return <SignupForm />;
}