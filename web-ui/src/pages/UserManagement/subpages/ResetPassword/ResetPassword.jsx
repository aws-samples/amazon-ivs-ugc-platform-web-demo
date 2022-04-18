import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ResetPasswordConfirmation from './ResetPasswordConfirmation';
import ResetPasswordRequestConfirmation from './ResetPasswordRequestConfirmation';
import ResetPasswordRequestForm from './ResetPasswordRequestForm';

const ResetPassword = () => {
  const [requestSent, setRequestSent] = useState(false);
  const { search } = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const { verificationCode, username } = useMemo(() => {
    const verificationCode = query.get('code');
    const username = query.get('username');

    return { verificationCode, username };
  }, [query]);

  useEffect(() => {
    if (!verificationCode || !username) {
      navigate('/reset', { replace: true });
    }
  }, [navigate, query, username, verificationCode]);

  if (verificationCode && username)
    return (
      <ResetPasswordConfirmation
        username={username}
        verificationCode={verificationCode}
      />
    );

  if (requestSent) return <ResetPasswordRequestConfirmation />;

  return <ResetPasswordRequestForm onSuccess={() => setRequestSent(true)} />;
};

export default ResetPassword;
