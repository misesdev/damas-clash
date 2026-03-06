import {useState} from 'react';
import {login} from '../api/auth';
import {ApiError} from '../api/client';

export function useLogin(onCodeSent: (email: string) => void) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const {email} = await login({identifier});
      onCodeSent(email);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 403
            ? 'Confirme seu e-mail antes de entrar.'
            : 'Usuário não encontrado.',
        );
      } else {
        setError('Erro de conexão. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {identifier, setIdentifier, error, loading, handleLogin};
}
