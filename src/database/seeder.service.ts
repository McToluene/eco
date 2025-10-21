import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { StateService } from '../state/state.service';
import { UserType } from '../user/enum/userType.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnModuleInit {
    private readonly logger = new Logger(SeederService.name);

    constructor(
        private readonly userService: UserService,
        private readonly stateService: StateService,
    ) { }

    async onModuleInit() {
        // Only run seeder in production or when explicitly enabled
        if (process.env.NODE_ENV === 'production' || process.env.RUN_SEEDER === 'true') {
            await this.seedAdminUser();
        }
    }

    private async seedAdminUser() {
        try {
            const adminUsername = process.env.ADMIN_USERNAME || 'admin';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

            // Check if admin already exists
            const existingAdmin = await this.userService.findOne(adminUsername);
            if (existingAdmin) {
                this.logger.log(`Admin user '${adminUsername}' already exists. Skipping creation.`);
                return;
            }

            // Create default state if none exists
            let state = await this.stateService.get();
            if (!state || state.length === 0) {
                this.logger.log('No states found. Creating default state...');
                state = [await this.stateService.create({ name: 'DEFAULT STATE', code: 'DS' })];
                this.logger.log('Default state created successfully.');
            }

            // Create admin user
            this.logger.log(`Creating admin user '${adminUsername}'...`);
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const adminUser = {
                userName: adminUsername,
                password: hashedPassword,
                state: state[0],
                userType: UserType.ADMIN,
                assignedPollingUnits: [],
                createdAt: new Date(),
            };

            await this.userService.create(adminUser as any);

            this.logger.log('================================');
            this.logger.log('✓ Admin user created successfully!');
            this.logger.log(`Username: ${adminUsername}`);
            this.logger.log(`Password: ${adminPassword}`);
            this.logger.log('================================');

            if (adminPassword === 'admin123') {
                this.logger.warn('⚠ WARNING: Using default password. Please change it after first login!');
                this.logger.warn('⚠ For production, set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.');
            }

        } catch (error) {
            this.logger.error('Error seeding admin user:', error.message);
            // Don't throw error to prevent app from failing to start
        }
    }
}
