import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    constructor(authService: AuthService, configService: ConfigService);
    validate(payload: any): Promise<{
        staff_id: any;
        email: any;
        store_code: any;
        role: any;
    }>;
}
export {};
