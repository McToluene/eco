import { SetMetadata } from '@nestjs/common';
import { UserType } from '../enum/userType.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);

export const POLLING_UNITS_KEY = 'polling_units';
export const RequirePollingUnits = () => SetMetadata(POLLING_UNITS_KEY, true);