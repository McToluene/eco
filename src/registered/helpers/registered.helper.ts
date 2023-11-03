import { readFileSync } from 'fs';
import * as xlsx from 'xlsx';
import { NotAcceptableException } from '@nestjs/common';
import { RegisteredVoter } from '../dtos/request/upload.request.dto';

export class RegisteredHelper {
  static processFile(file: Express.Multer.File): RegisteredVoter[] {
    if (file) {
      const requiredProperties = ['name', 'id', 'gender', 'dob'];
      const workbook = xlsx.read(readFileSync(file.path), { type: 'buffer' });
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

      const registeredVoters: RegisteredVoter[] = jsonData.map((data) => {
        const voter = new RegisteredVoter();
        voter.name = data['name'];
        voter.id = data['id'];
        voter.gender = data['gender'];
        voter.dob = data['dob'];
        return voter;
      });
      return registeredVoters;
    }
  }
}
