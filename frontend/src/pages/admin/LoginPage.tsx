import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error: signInError } = await signIn(email, password);
    if (signInError) setError(signInError);
    else navigate('/admin');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-brand-600">KIKIDS Admin</h1>
        <input type="email" required placeholder="Correo" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2" />
        <input type="password" required placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2" />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white">
          Ingresar
        </button>
      </form>
    </div>
  );
}
