import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ResetPasswordConfirmation from './ResetPasswordConfirmation';
import ResetPasswordRequestConfirmation from './ResetPasswordRequestConfirmation';
import ResetPasswordRequestForm from './ResetPasswordRequestForm';

const ResetPassword = () => {
  const [requestSent, setRequestSent] = useState(false);
  const [email, setEmail] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verificationCode, username } = useMemo(
    () => ({
      verificationCode: searchParams.get('code'),
      username: searchParams.get('username')
    }),
    [searchParams]
  );

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
