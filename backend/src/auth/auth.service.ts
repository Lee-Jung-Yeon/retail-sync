import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Staff } from '../entities';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Staff) private staffRepo: Repository<Staff>,
        private jwtService: JwtService,
    ) { }

    async register(email: string, password: string, staffName: string, storeCode: string, role = 'SELLER') {
        const hash = await bcrypt.hash(password, 10);
        const staff = this.staffRepo.create({
            email, password_hash: hash, staff_name: staffName, store_code: storeCode, role,
        });
        const saved = await this.staffRepo.save(staff);
        return { staff_id: saved.staff_id, email: saved.email, store_code: saved.store_code };
    }

    async login(email: string, password: string) {
        const staff = await this.staffRepo.findOne({ where: { email, is_active: true } });
        if (!staff) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        const valid = await bcrypt.compare(password, staff.password_hash);
        if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        const payload = { sub: staff.staff_id, email: staff.email, store_code: staff.store_code, role: staff.role };
        return { access_token: this.jwtService.sign(payload), staff_id: staff.staff_id, store_code: staff.store_code };
    }

    async validateStaff(staffId: string) {
        return this.staffRepo.findOne({ where: { staff_id: staffId, is_active: true } });
    }
}
