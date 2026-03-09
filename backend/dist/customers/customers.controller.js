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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const customers_service_1 = require("./customers.service");
let CustomersController = class CustomersController {
    constructor(customersService) {
        this.customersService = customersService;
    }
    lookup(phone, gender, age) {
        return this.customersService.lookup(phone, gender, age);
    }
    getProfileCard(id) {
        return this.customersService.getProfileCard(id);
    }
    getPreferences(id) {
        return this.customersService.getPreferences(id);
    }
    updatePreferences(id, body) {
        return this.customersService.upsertPreferences(id, body.session_id, body.preferences);
    }
    joinMembership(id) {
        return this.customersService.joinMembership(id);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)('lookup'),
    __param(0, (0, common_1.Query)('phone_last4')),
    __param(1, (0, common_1.Query)('gender')),
    __param(2, (0, common_1.Query)('age_group')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "lookup", null);
__decorate([
    (0, common_1.Get)(':id/profile-card'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "getProfileCard", null);
__decorate([
    (0, common_1.Get)(':id/preferences'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Patch)(':id/preferences'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Post)(':id/membership'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "joinMembership", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map