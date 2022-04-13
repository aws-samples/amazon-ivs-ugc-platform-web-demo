import { Route, Routes, Navigate } from 'react-router-dom';

import Grid from '../../components/Grid';
import RecoverPassword from './subpages/RecoverPassword';
import RegisterUser from './subpages/RegisterUser';
import SigninUser from './subpages/SigninUser';
import { app as $content } from '../../content';
import './UserManagement.css';

const UserManagement = () => (
  <Grid>
    <Grid.Col>
      <section className="welcome-section">
        <h1>{$content.title}</h1>
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

export default UserManagement;
