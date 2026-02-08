import { IsString } from 'class-validator';

/**
 * DTO for bulk upload of CSV files for polling units
 * 
 * This is used with the /registered/bulk-upload/:wardId endpoint
 * The endpoint accepts multiple CSV files that end with "_cleaned"
 * 
 * File naming format: CODE_NAME_cleaned.csv
 * Example: 001_SCHOOL_HALL_APABU_CENTRAL_cleaned.csv
 * - Code: 001
 * - Name: SCHOOL HALL APABU CENTRAL
 * 
 * The endpoint will:
 * 1. Filter files ending with "_cleaned"
 * 2. Extract code and name from filename
 * 3. Create polling unit with the extracted code and name
 * 4. Upload CSV data as registered voters for that polling unit
 */
export class BulkUploadDto {
  @IsString()
  wardId: string;
}
