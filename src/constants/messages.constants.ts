export const HTTP_MESSAGES = {
    SUCCESS: {
        ENTRY_SAVED: 'Entry saved successfully!',
        ENTRY_FETCHED: 'Entry fetched successfully!',
        USER_REGISTERED: 'User registered successfully!',
        USER_LOGGED_IN: 'Logged in successfully!',
        STATE_SAVED: 'State saved successfully!',
        STATE_FETCHED: 'State fetched successfully!',
        LGA_SAVED: 'Lga saved successfully!',
        LGA_FETCHED: 'Lga fetched successfully!',
        WARD_FETCHED: 'Ward fetched successfully!',
        WARDS_FETCHED: 'Wards fetched successfully!',
        POLLING_UNIT_FETCHED: 'Polling unit fetched successfully!',
        REGISTERED_VOTERS_FETCHED: 'Registered voters fetched successfully!',
        REGISTERED_VOTERS_DELETED: 'Registered voters deleted successfully!',
        REGISTERED_VOTERS_MOVED: 'Registered voters moved successfully!',
        PICTURE_UPLOADED: 'Registered voters picture uploaded successfully!',
    },
    ERROR: {
        FILE_NOT_UPLOADED: 'No file uploaded.',
        FILES_REQUIRED: 'Please add files to upload',
        USER_CREATION_FAILED: 'Failed to create user',
        USER_ALREADY_EXISTS: 'User already exists!',
        WARD_ALREADY_EXISTS: 'Ward already exists',
        LGA_ALREADY_EXISTS: 'Lga already exists in state',
        POLLING_UNIT_ALREADY_EXISTS: 'Polling unit already exists in ward',
        LGA_NOT_FOUND: 'Lga not found',
        WARD_NOT_FOUND: 'Ward not found',
        STATE_NOT_FOUND: 'State not found',
        POLLING_UNIT_NOT_FOUND: 'Polling Unit not found!',
        INSUFFICIENT_REGISTERED_VOTERS: 'Insufficient registered voters in source polling unit',
        POLLING_UNIT_NOT_IN_STATE: 'One or more polling units do not belong to the specified state',
        INVALID_CREDENTIALS: 'Invalid login credentials',
    },
} as const;

export const FILE_EXTENSIONS = {
    XLSX: 'xlsx',
    CSV: 'csv',
} as const;

export const TIMEOUTS = {
    SERVER_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    JWT_EXPIRES_IN: '2days',
} as const;

export const CLOUDINARY_FOLDERS = {
    ELECTION: 'election',
} as const;