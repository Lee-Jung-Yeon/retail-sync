"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const memos_service_1 = require("./memos.service");
describe('MemosService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [memos_service_1.MemosService],
        }).compile();
        service = module.get(memos_service_1.MemosService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=memos.service.spec.js.map