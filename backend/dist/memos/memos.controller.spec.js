"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const memos_controller_1 = require("./memos.controller");
describe('MemosController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [memos_controller_1.MemosController],
        }).compile();
        controller = module.get(memos_controller_1.MemosController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=memos.controller.spec.js.map