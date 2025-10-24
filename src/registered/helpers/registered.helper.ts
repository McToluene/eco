import * as xlsx from 'xlsx';
import * as csv from 'csv-parser';
import { PassThrough } from 'stream';
import { NotAcceptableException } from '@nestjs/common';

export class RegisteredHelper {
  /**
   * Generate random name
   */
  private static generateRandomName(): string {
    const firstNames = ['Chidi', 'Ngozi', 'Emeka', 'Ada', 'Obinna', 'Chioma', 'Ikenna', 'Amara', 'Uche', 'Chiamaka'];
    const lastNames = ['Okafor', 'Eze', 'Nwosu', 'Okeke', 'Okonkwo', 'Udeh', 'Nnamdi', 'Onyeka', 'Chukwu', 'Okoro'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate random ID (numeric string of 10-12 digits)
   */
  private static generateRandomId(): string {
    const length = Math.floor(Math.random() * 3) + 10; // 10-12 digits
    let id = '';
    for (let i = 0; i < length; i++) {
      id += Math.floor(Math.random() * 10);
    }
    return id;
  }

  /**
   * Generate random gender
   */
  private static generateRandomGender(): string {
    return Math.random() > 0.5 ? 'M' : 'F';
  }

  /**
   * Generate random date of birth (between 18 and 80 years ago)
   */
  private static generateRandomDOB(): string {
    const today = new Date();
    const minAge = 18;
    const maxAge = 80;
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const birthYear = today.getFullYear() - age;
    return birthYear.toString();
  }

  /**
   * Fill missing data with random values
   */
  private static fillMissingData(row: any): any {
    const filledRow = { ...row };

    // if (!filledRow['NAME'] || filledRow['NAME'].trim() === '') {
    //   filledRow['NAME'] = this.generateRandomName();
    // }

    if (!filledRow['ID'] || filledRow['ID'].trim() === '') {
      filledRow['ID'] = this.generateRandomId();
    }

    if (!filledRow['GENDER'] || filledRow['GENDER'].trim() === '') {
      filledRow['GENDER'] = this.generateRandomGender();
    }

    if (!filledRow['DOB'] || filledRow['DOB'].trim() === '') {
      filledRow['DOB'] = this.generateRandomDOB();
    }

    return filledRow;
  }
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

      const processedData = jsonData.map(row => this.fillMissingData(row));

      return processedData;
    }
  }

  static async processFileCsv(file: Express.Multer.File): Promise<any[]> {
    if (!file) {
      throw new NotAcceptableException('No file provided.');
    }

    const requiredProperties = ['NAME', 'ID', 'GENDER', 'DOB'];
    const jsonData = [];

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

          const processedData = jsonData.map(row => this.fillMissingData(row));
          resolve(processedData);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
