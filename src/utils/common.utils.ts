import { Injectable } from '@nestjs/common';

@Injectable()
export class StringUtils {
    /**
     * Normalizes string by trimming whitespace and converting to uppercase
     */
    static normalizeString(input: string): string {
        return input?.trim().toUpperCase() || '';
    }

    /**
     * Extracts file extension from filename
     */
    static getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toLowerCase() || '';
    }

    /**
     * Parses polling unit code from delimitation string
     */
    static parsePollingUnitCode(delimitation: string): string {
        const parts = delimitation.split('-');
        return parts[3] || '';
    }
}

@Injectable()
export class MathUtils {
    /**
     * Calculates accredited count based on percentage and collected PVCs
     */
    static calculateAccreditedCount(percentage: number, collectedPvc: number): number {
        return percentage !== 0 ? Math.ceil(collectedPvc * (percentage / 100)) : collectedPvc;
    }
}

@Injectable()
export class ResponseUtils {
    /**
     * Creates a standardized success response
     */
    static createSuccessResponse<T>(message: string, data: T, status: number) {
        return {
            message,
            data,
            status,
        };
    }
}