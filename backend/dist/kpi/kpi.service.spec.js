"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const kpi_service_1 = require("./kpi.service");
describe('KpiService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [kpi_service_1.KpiService],
        }).compile();
        service = module.get(kpi_service_1.KpiService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=kpi.service.spec.js.map