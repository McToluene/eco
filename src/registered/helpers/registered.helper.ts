import * as xlsx from 'xlsx';
import * as csv from 'csv-parser';
import { PassThrough } from 'stream';
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

  static async processFileCsv(file: Express.Multer.File): Promise<any[]> {
    if (!file) {
      throw new NotAcceptableException('No file provided.');
    }

    const requiredProperties = ['NAME', 'ID', 'GENDER', 'DOB'];
    const jsonData = [];

    // Read the CSV file using csv-parser
    return new Promise((resolve, reject) => {
      if (!file.buffer) {
        reject(new NotAcceptableException('File buffer is empty.'));
        return;
      }

      const bufferStream = new PassThrough();
      bufferStream.end(file.buffer);

      bufferStream
        .pipe(csv())
        .on('data', (row) => {
          jsonData.push(row);
        })
        .on('end', () => {
          // Check if all required properties are present in the CSV file
          const columnHeaders = Object.keys(jsonData[0] || {});
          for (const prop of requiredProperties) {
            if (!columnHeaders.includes(prop)) {
              reject(
                new NotAcceptableException(
                  `Required property "${prop}" not found in the CSV file.`,
                ),
              );
              return;
            }
          }
          resolve(jsonData);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
