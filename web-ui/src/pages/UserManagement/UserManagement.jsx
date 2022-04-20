import { Route, Routes, Navigate } from 'react-router-dom';

import { app as $content } from '../../content';
import Grid from '../../components/Grid';
import Notification from '../../components/Notification';
import RegisterUser from './subpages/RegisterUser';
import ResetPassword from './subpages/ResetPassword';
import SigninUser from './subpages/SigninUser';
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
        <Notification />
        <Routes>
          <Route path="login" element={<SigninUser />} />
          <Route path="register" element={<RegisterUser />} />
          <Route path="reset" element={<ResetPassword />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </section>
    </Grid.Col>
  </Grid>
);

export default UserManagement;
