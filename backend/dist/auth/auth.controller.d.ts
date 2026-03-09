import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: {
        email: string;
        password: string;
        staff_name: string;
        store_code: string;
        role?: string;
    }): Promise<{
        staff_id: string;
        email: string;
        store_code: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        staff_id: string;
        store_code: string;
    }>;
}
