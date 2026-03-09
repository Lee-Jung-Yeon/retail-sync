import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Staff } from '../entities';
export declare class AuthService {
    private staffRepo;
    private jwtService;
    constructor(staffRepo: Repository<Staff>, jwtService: JwtService);
    register(email: string, password: string, staffName: string, storeCode: string, role?: string): Promise<{
        staff_id: string;
        email: string;
        store_code: string;
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        staff_id: string;
        store_code: string;
    }>;
    validateStaff(staffId: string): Promise<Staff | null>;
}
