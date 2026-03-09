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
exports.MemosController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const memos_service_1 = require("./memos.service");
let MemosController = class MemosController {
    constructor(memosService) {
        this.memosService = memosService;
    }
    async createMemo(sessionId, body) {
        return this.memosService.createMemo(sessionId, body.customer_id, body.input_type, body.text, body.fitting_id);
    }
};
exports.MemosController = MemosController;
__decorate([
    (0, common_1.Post)(':sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemosController.prototype, "createMemo", null);
exports.MemosController = MemosController = __decorate([
    (0, common_1.Controller)('api/memos'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [memos_service_1.MemosService])
], MemosController);
//# sourceMappingURL=memos.controller.js.map