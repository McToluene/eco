import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { HTTP_MESSAGES } from '../constants/messages.constants';

export class UserAlreadyExistsException extends ConflictException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.USER_ALREADY_EXISTS);
    }
}

export class LgaNotFoundException extends NotFoundException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.LGA_NOT_FOUND);
    }
}

export class StateNotFoundException extends NotFoundException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.STATE_NOT_FOUND);
    }
}

export class WardNotFoundException extends NotFoundException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.WARD_NOT_FOUND);
    }
}

export class PollingUnitNotFoundException extends NotFoundException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.POLLING_UNIT_NOT_FOUND);
    }
}

export class PollingUnitNotInStateException extends BadRequestException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.POLLING_UNIT_NOT_IN_STATE);
    }
}

export class WardAlreadyExistsException extends ConflictException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.WARD_ALREADY_EXISTS);
    }
}

export class FileNotUploadedException extends BadRequestException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.FILE_NOT_UPLOADED);
    }
}

export class LgaAlreadyExistsException extends ConflictException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.LGA_ALREADY_EXISTS);
    }
}

export class PollingUnitAlreadyExistsException extends ConflictException {
    constructor() {
        super(HTTP_MESSAGES.ERROR.POLLING_UNIT_ALREADY_EXISTS);
    }
}