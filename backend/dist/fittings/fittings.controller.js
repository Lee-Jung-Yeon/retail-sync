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
exports.FittingsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const fittings_service_1 = require("./fittings.service");
let FittingsController = class FittingsController {
    constructor(fittingsService) {
        this.fittingsService = fittingsService;
    }
    addFitting(sessionId, body) {
        return this.fittingsService.addFitting(sessionId, body);
    }
    addReasons(sessionId, fittingId, body) {
        return this.fittingsService.addReasons(fittingId, sessionId, body.customer_id, body.reasons);
    }
};
exports.FittingsController = FittingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FittingsController.prototype, "addFitting", null);
__decorate([
    (0, common_1.Post)(':fittingId/reasons'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('fittingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FittingsController.prototype, "addReasons", null);
exports.FittingsController = FittingsController = __decorate([
    (0, common_1.Controller)('sessions/:sessionId/fittings'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [fittings_service_1.FittingsService])
], FittingsController);
//# sourceMappingURL=fittings.controller.js.map