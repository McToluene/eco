import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { StateService } from '../state/state.service';
import { UserType } from '../user/enum/userType.enum';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
    console.log('Starting admin user creation process...');

    let app;
    try {
        app = await NestFactory.createApplicationContext(AppModule, {
            logger: ['error', 'warn', 'log'],
        });

        const userService = app.get(UserService);
        const stateService = app.get(StateService);

        // Get admin credentials from environment or use defaults
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // Check if admin already exists
        const existingAdmin = await userService.findOne(adminUsername);
        if (existingAdmin) {
            console.log(`Admin user '${adminUsername}' already exists. Skipping creation.`);
            await app.close();
            process.exit(0);
        }

        // Create a default state if none exists
        let state = await stateService.get();
        if (!state || state.length === 0) {
            console.log('No states found. Creating default state...');
            state = [await stateService.create({ name: 'DEFAULT STATE', code: 'DS' })];
            console.log('Default state created successfully.');
        }

        // Create admin user
        console.log(`Creating admin user '${adminUsername}'...`);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const adminUser = {
            userName: adminUsername,
            password: hashedPassword,
            state: state[0],
            userType: UserType.ADMIN,
            assignedPollingUnits: [],
            createdAt: new Date(),
        };

        await userService.create(adminUser as any);
        console.log('✓ Admin user created successfully!');
        console.log('================================');
        console.log(`Username: ${adminUsername}`);
        console.log(`Password: ${adminPassword}`);
        console.log('================================');

        if (adminPassword === 'admin123') {
            console.warn('⚠ WARNING: Using default password. Please change it after first login!');
            console.warn('⚠ For production, set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.');
        }

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    } finally {
        if (app) {
            await app.close();
        }
    }

    process.exit(0);
}

createAdminUser();