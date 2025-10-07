import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../enum/userType.enum';
import { POLLING_UNITS_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PollingUnitsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiresPollingUnits = this.reflector.getAllAndOverride<boolean>(POLLING_UNITS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiresPollingUnits) {
            return true;
        }

        const { user, params } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Admin can access everything
        if (user.userType === UserType.ADMIN) {
            return true;
        }

        // For agents, check if they have access to the requested polling unit
        const pollingUnitId = params.pollingUnitId || params.id;

        if (!pollingUnitId) {
            return true; // If no specific polling unit is requested, allow
        }

        const hasAccess = user.assignedPollingUnits?.some(
            (unit: any) => unit._id.toString() === pollingUnitId
        );

        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this polling unit');
        }

        return true;
    }
}