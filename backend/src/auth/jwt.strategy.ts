import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService, configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('JWT_SECRET', 'rs_jwt_secret'),
        });
    }

    async validate(payload: any) {
        const staff = await this.authService.validateStaff(payload.sub);
        if (!staff) throw new UnauthorizedException();
        return { staff_id: payload.sub, email: payload.email, store_code: payload.store_code, role: payload.role };
    }
}
