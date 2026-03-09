import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() body: { email: string; password: string; staff_name: string; store_code: string; role?: string }) {
        return this.authService.register(body.email, body.password, body.staff_name, body.store_code, body.role);
    }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }
}
