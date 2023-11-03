import * as xlsx from 'xlsx';
import { NotAcceptableException } from '@nestjs/common';

export class RegisteredHelper {
  static processFile(file: Express.Multer.File): any[] {
    if (file) {
      const requiredProperties = ['NAME', 'ID', 'GENDER', 'DOB'];
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
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
