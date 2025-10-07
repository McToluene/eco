import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { StateService } from '../state/state.service';
import { UserType } from '../user/enum/userType.enum';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const userService = app.get(UserService);
    const stateService = app.get(StateService);

    try {
        // Check if admin already exists
        const existingAdmin = await userService.findOne('admin');
        if (existingAdmin) {
            console.log('Admin user already exists');
            await app.close();
            return;
        }

        // Create a default state if none exists (you should replace this with actual state data)
        let state = await stateService.get();
        if (!state || state.length === 0) {
            console.log('Creating default state...');
            state = [await stateService.create({ name: 'DEFAULT STATE', code: 'DS' })];
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const adminUser = {
            userName: 'admin',
            password: hashedPassword,
            state: state[0],
            userType: UserType.ADMIN,
            assignedPollingUnits: [],
            createdAt: new Date(),
        };

        await userService.create(adminUser as any);
        console.log('Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Please change the password after first login.');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await app.close();
    }
}

createAdminUser();