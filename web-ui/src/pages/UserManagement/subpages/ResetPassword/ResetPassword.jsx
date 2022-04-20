import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ResetPasswordConfirmation from './ResetPasswordConfirmation';
import ResetPasswordRequestConfirmation from './ResetPasswordRequestConfirmation';
import ResetPasswordRequestForm from './ResetPasswordRequestForm';

const ResetPassword = () => {
  const [requestSent, setRequestSent] = useState(false);
  const [email, setEmail] = useState('');
  const { search } = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const { verificationCode, username } = useMemo(() => {
    const verificationCode = query.get('code');
    const username = query.get('username');

    return { verificationCode, username };
  }, [query]);

  const onRequestSuccess = (_result, formValues) => {
    setEmail(formValues.email);
    setRequestSent(true);
  };

  useEffect(() => {
    if (!verificationCode || !username) {
      navigate('/reset', { replace: true });
    }
  }, [navigate, username, verificationCode]);

  if (verificationCode && username)
    return (
      <ResetPasswordConfirmation
        username={username}
        verificationCode={verificationCode}
      />
    );

  if (requestSent) return <ResetPasswordRequestConfirmation email={email} />;

  return <ResetPasswordRequestForm onSuccess={onRequestSuccess} />;
};

export default ResetPassword;
