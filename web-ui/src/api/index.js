import { getCurrentSession } from './utils';
import * as userManagementAPI from './userManagement';

const userManagement = { getCurrentSession, ...userManagementAPI };

export { userManagement };
