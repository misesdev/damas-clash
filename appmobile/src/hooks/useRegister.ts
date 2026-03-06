import {useState} from 'react';
import {register} from '../api/auth';
import {ApiError} from '../api/client';

type FormErrors = Partial<Record<'username' | 'email' | 'general', string>>;

function validate(username: string, email: string): FormErrors {
  const errors: FormErrors = {};
  if (username.length < 3) {errors.username = 'Mínimo 3 caracteres.';}
  if (!email.includes('@')) {errors.email = 'E-mail inválido.';}
  return errors;
}

export function useRegister(onRegistered: (email: string) => void) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const validationErrors = validate(username, email);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({username, email});
      onRegistered(email);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.message === 'email_taken') {
          setErrors({email: 'E-mail já cadastrado.'});
        } else if (e.message === 'username_taken') {
          setErrors({username: 'Nome de usuário já existe.'});
        } else {
          setErrors({general: 'Erro ao criar conta. Tente novamente.'});
        }
      } else {
        setErrors({general: 'Erro de conexão. Tente novamente.'});
      }
    } finally {
      setLoading(false);
    }
  };

  return {username, setUsername, email, setEmail, errors, loading, handleRegister};
}
