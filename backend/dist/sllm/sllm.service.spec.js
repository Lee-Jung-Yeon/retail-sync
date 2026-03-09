"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const sllm_service_1 = require("./sllm.service");
describe('SllmService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [sllm_service_1.SllmService],
        }).compile();
        service = module.get(sllm_service_1.SllmService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=sllm.service.spec.js.map