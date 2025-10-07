import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseConfig {
    private readonly logger = new Logger(DatabaseConfig.name);

    constructor(@InjectConnection() private connection: Connection) { }

    async createIndexes(): Promise<void> {
        try {
            // User indexes
            await this.connection.collection('users').createIndex({ userName: 1 }, { unique: true });
            await this.connection.collection('users').createIndex({ userType: 1 });
            await this.connection.collection('users').createIndex({ state: 1 });
            await this.connection.collection('users').createIndex({ assignedPollingUnits: 1 });
            await this.connection.collection('users').createIndex({ createdBy: 1 });

            // State indexes
            await this.connection.collection('states').createIndex({ name: 1, code: 1 }, { unique: true });

            // LGA indexes
            await this.connection.collection('lgas').createIndex({ name: 1, state: 1, code: 1 }, { unique: true });
            await this.connection.collection('lgas').createIndex({ state: 1 });

            // Ward indexes
            await this.connection.collection('wards').createIndex({ name: 1, lga: 1, code: 1 }, { unique: true });
            await this.connection.collection('wards').createIndex({ lga: 1 });

            // PollingUnit indexes
            await this.connection.collection('pollingunits').createIndex({ ward: 1, code: 1 }, { unique: true });
            await this.connection.collection('pollingunits').createIndex({ ward: 1 });
            await this.connection.collection('pollingunits').createIndex({ name: 1 });

            // Registered voters indexes
            await this.connection.collection('registereds').createIndex({ pollingUnit: 1, refIndex: 1 });
            await this.connection.collection('registereds').createIndex({ pollingUnit: 1 });

            this.logger.log('Database indexes created successfully');
        } catch (error) {
            this.logger.error('Error creating database indexes:', error);
        }
    }
}