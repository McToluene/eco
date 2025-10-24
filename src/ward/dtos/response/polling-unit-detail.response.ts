export default class PollingUnitDetailResponse {
    _id: string;
    name: string;
    code: string;
    accreditedCount: number;
    registeredCount: number;
    ward: {
        _id: string;
        name: string;
        code: string;
        lga: {
            _id: string;
            name: string;
            code: string;
            state: {
                _id: string;
                name: string;
                code: string;
            };
        };
    };
}
