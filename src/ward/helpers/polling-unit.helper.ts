import * as xlsx from 'xlsx';
import { NotAcceptableException } from '@nestjs/common';

export class PollingUnitHelper {
  static processFile(file: Express.Multer.File): any[] {
    if (file) {
      const requiredProperties = [
        'S/N',
        'STATE',
        'LGA',
        'Registration Area',
        'Polling Unit',
        'Delimitation',
        'No of Registered Voters',
        'No of Collected PVCs',
        'No of Uncollected PVCs',
        'Percentage of Collected PVCs to Registered Voters',
      ];
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[2];
      const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const columnHeaders = Object.keys(jsonData[0]);
      for (const prop of requiredProperties) {
        if (!columnHeaders.includes(prop)) {
          throw new NotAcceptableException(
            `Required property "${prop}" not found in the Excel file.`,
          );
        }
      }

      return jsonData;
    }
  }
}
