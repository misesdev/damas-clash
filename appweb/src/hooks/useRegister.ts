'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { register } from '../api/auth';
import { ApiError } from '../api/client';
import '../i18n';

type FormErrors = Partial<Record<'username' | 'email' | 'general', string>>;

export function useRegister(onRegistered: (email: string) => void) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (u: string, e: string): FormErrors => {
    const errs: FormErrors = {};
    if (u.length < 3) errs.username = t('register_errorUsernameMin');
    else if (u.length > 50) errs.username = t('register_errorUsernameMax');
    if (!e.includes('@')) errs.email = t('register_errorEmailInvalid');
    else if (e.length > 100) errs.email = t('register_errorEmailMax');
    return errs;
  };

  const handleRegister = async () => {
    const validationErrors = validate(username, email);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({ username, email });
      onRegistered(email);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.message === 'email_taken') {
          setErrors({ email: t('register_errorEmailTaken') });
        } else if (e.message === 'username_taken') {
          setErrors({ username: t('register_errorUsernameTaken') });
        } else {
          setErrors({ general: t('register_errorGeneral') });
        }
      } else {
        setErrors({ general: t('register_errorConnection') });
      }
    } finally {
      setLoading(false);
    }
  };

  return { username, setUsername, email, setEmail, errors, loading, handleRegister };
}
