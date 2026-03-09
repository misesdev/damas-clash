import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {register} from '../api/auth';
import {ApiError} from '../api/client';

type FormErrors = Partial<Record<'username' | 'email' | 'general', string>>;

export function useRegister(onRegistered: (email: string) => void) {
  const {t} = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (u: string, e: string): FormErrors => {
    const errs: FormErrors = {};
    if (u.length < 3) {errs.username = t('register.errors.usernameTooShort');}
    else if (u.length > 50) {errs.username = t('register.errors.usernameTooLong');}
    if (!e.includes('@')) {errs.email = t('register.errors.emailInvalid');}
    else if (e.length > 100) {errs.email = t('register.errors.emailTooLong');}
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
      await register({username, email});
      onRegistered(email);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.message === 'email_taken') {
          setErrors({email: t('register.errors.emailTaken')});
        } else if (e.message === 'username_taken') {
          setErrors({username: t('register.errors.usernameTaken')});
        } else {
          setErrors({general: t('register.errors.general')});
        }
      } else {
        setErrors({general: t('register.errors.connectionError')});
      }
    } finally {
      setLoading(false);
    }
  };

  return {username, setUsername, email, setEmail, errors, loading, handleRegister};
}
