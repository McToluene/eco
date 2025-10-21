import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserType } from '../enum/userType.enum';
import { POLLING_UNITS_KEY } from '../decorators/roles.decorator';
import { PollingUnit, PollingUnitDocument } from '../../ward/schemas/polling.schema';

@Injectable()
export class PollingUnitsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectModel(PollingUnit.name) private pollingUnitModel: Model<PollingUnitDocument>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
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

        // State-based access: User has access to ALL polling units in their states
        if (user.hasStateBasedAccess && user.stateIds && user.stateIds.length > 0) {
            // Fetch the polling unit with its state hierarchy
            const pollingUnit = await this.pollingUnitModel.findById(pollingUnitId)
                .populate({
                    path: 'ward',
                    populate: {
                        path: 'lga',
                        populate: {
                            path: 'state',
                            model: 'State'
                        }
                    }
                });

            if (!pollingUnit) {
                throw new ForbiddenException('Polling unit not found');
            }

            const pollingUnitStateId = (pollingUnit as any).ward?.lga?.state?._id?.toString();

            if (!pollingUnitStateId) {
                throw new ForbiddenException('Unable to determine polling unit state');
            }

            const hasAccess = user.stateIds.includes(pollingUnitStateId);

            if (!hasAccess) {
                throw new ForbiddenException('You do not have access to polling units in this state');
            }

            return true;
        }

        // Polling unit-based access: User has access only to specific assigned polling units
        const hasAccess = user.assignedPollingUnits?.some(
            (unit: any) => unit._id.toString() === pollingUnitId
        );

        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this polling unit');
        }

        return true;
    }
}