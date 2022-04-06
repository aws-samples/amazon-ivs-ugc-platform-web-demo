import { Route, Routes, Navigate } from 'react-router-dom';

import Grid from '../../components/Grid';
// Pages
import RecoverPassword from './components/RecoverPassword';
import RegisterUser from './components/RegisterUser';
import SigninUser from './components/SigninUser';

import './UserManagementRouter.css';

const SigninAndSignup = () => (
  <Grid>
    <Grid.Col>
      <section className="welcome-section">
        <h1>Stream Health</h1>
      </section>
    </Grid.Col>
    <Grid.Col autoFit>
      <section className="form-section">
        <Routes>
          <Route path="login" element={<SigninUser />} />
          <Route path="register" element={<RegisterUser />} />
          <Route path="recover" element={<RecoverPassword />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </section>
    </Grid.Col>
  </Grid>
);

export default SigninAndSignup;
