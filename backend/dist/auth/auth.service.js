"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const entities_1 = require("../entities");
let AuthService = class AuthService {
    constructor(staffRepo, jwtService) {
        this.staffRepo = staffRepo;
        this.jwtService = jwtService;
    }
    async register(email, password, staffName, storeCode, role = 'SELLER') {
        const hash = await bcrypt.hash(password, 10);
        const staff = this.staffRepo.create({
            email, password_hash: hash, staff_name: staffName, store_code: storeCode, role,
        });
        const saved = await this.staffRepo.save(staff);
        return { staff_id: saved.staff_id, email: saved.email, store_code: saved.store_code };
    }
    async login(email, password) {
        const staff = await this.staffRepo.findOne({ where: { email, is_active: true } });
        if (!staff)
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        const valid = await bcrypt.compare(password, staff.password_hash);
        if (!valid)
            throw new common_1.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        const payload = { sub: staff.staff_id, email: staff.email, store_code: staff.store_code, role: staff.role };
        return { access_token: this.jwtService.sign(payload), staff_id: staff.staff_id, store_code: staff.store_code };
    }
    async validateStaff(staffId) {
        return this.staffRepo.findOne({ where: { staff_id: staffId, is_active: true } });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map