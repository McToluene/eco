import { UserType } from '../../enum/userType.enum';

export interface UserResponse {
    _id: string;
    userName: string;
    userType: UserType;
    state: {
        _id: string;
        name: string;
        code: string;
    };
    assignedPollingUnits: Array<{
        _id: string;
        name: string;
        code: string;
        ward: {
            _id: string;
            name: string;
            code: string;
        };
    }>;
    createdAt: Date;
    createdBy?: {
        _id: string;
        userName: string;
    };
}

export interface UserListResponse {
    users: UserResponse[];
    total: number;
    page: number;
    limit: number;
}