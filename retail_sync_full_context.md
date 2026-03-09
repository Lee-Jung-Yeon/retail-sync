# Retail Sync 프로젝트 전체 컨텍스트 (LLM 학습 및 분석용)

본 문서는 오프라인 패션 매장 환경에서 사용하는 "Retail Sync" 2차 PoC 프로젝트의 전체 아키텍처, 데이터베이스 스키마, 그리고 프론트엔드/백엔드 소스코드 전체를 하나로 통합한 문서입니다. 새로운 LLM에게 컨텍스트를 주입하거나 아키텍처를 분석할 때 사용하세요.

---

## 🏗 프로젝트 개요 및 아키텍처
- **목적**: 오프라인 매장의 접객 데이터(고객 정보, 피팅 내역, 미구매 사유, 직원 메모, VoC)를 태블릿과 노트북 환경을 구분하여 수집하고, 실시간 대시보드를 통해 A/B 테스트(Treatment vs Control) 성과를 추적하는 PoC 시스템.
- **분리된 UI/UX**:
  - `/input` (태블릿용): 매장 직원이 접객 중 서서 빠르게 데이터를 입력 (고객조회 -> 피팅상품 등록 -> 미구매 사유 태그 선택)
  - `/memo` (노트북용): 접객 완료 후 계산대 등에서 비정형 메모(텍스트)와 관찰 VoC(별점, 태그)를 분리하여 심층 기록
  - `/store` & `/hq` (PC용): 실시간 접객 현황 및 A/B 테스트 지표 대시보드 시각화
- **기술 스택**:
  - **Frontend**: React 18, Vite, React Router, TailwindCSS, Recharts, Lucide-React
  - **Backend**: NestJS 10, TypeORM, PostgreSQL (Supabase 연동)
  - **Database**: Supabase PostgreSQL (생산성 및 확장성을 위해 클라우드 전환)

---

## 🗄 데이터베이스 스키마 (초기화 SQL)
아래는 Supabase에 구축된 데이터베이스 테이블 정의서(DDL)입니다.

```sql
-- Retail Sync 2nd PoC Database Schema

-- 1. 고객 테이블 (customers)
-- 오프라인 매장에 방문한 고객 정보를 통합, 식별하기 위한 용도
CREATE TABLE customers (
  customer_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_last4         VARCHAR(4),
  gender              VARCHAR(1) NOT NULL,
  age_group           VARCHAR(4) NOT NULL,
  membership_status   VARCHAR(10) DEFAULT 'NON_MEMBER',
  membership_joined_at TIMESTAMP,
  first_visit_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  total_visit_count   INTEGER DEFAULT 1,
  total_purchase_count INTEGER DEFAULT 0,
  total_purchase_amount BIGINT DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- 2. 방문 세션 테이블 (visit_sessions)
-- 고객이 특정 매장에 방문하여 이루어진 1번의 전체 응대 세션 기록 용도
CREATE TABLE visit_sessions (
  session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  store_code          VARCHAR(20) NOT NULL,
  staff_id            UUID NOT NULL,
  visit_type          VARCHAR(10) NOT NULL,
  companion_type      VARCHAR(10),
  visit_purpose       VARCHAR(20),
  session_start       TIMESTAMP NOT NULL DEFAULT NOW(),
  session_end         TIMESTAMP,
  duration_seconds    INTEGER,
  day_of_week         SMALLINT,
  hour_of_day         SMALLINT,
  is_treatment        BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 3. 피팅/상품 접촉 테이블 (fitting_records)
-- 방문 세션 중 고객이 실제로 입어보거나 관심을 가진 상품 정보 기록 용도
CREATE TABLE fitting_records (
  fitting_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  product_code        VARCHAR(30),
  product_category    VARCHAR(30),
  fitting_size        VARCHAR(5),
  fitting_color       VARCHAR(20),
  did_try_on          BOOLEAN DEFAULT TRUE,
  purchase_result     VARCHAR(10) NOT NULL,
  purchase_amount     BIGINT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 4. 미구매 사유 테이블 (non_purchase_reasons)
-- 피팅을 경험했지만 최종적으로 구매하지 않은 정확한 사유와 서브태그(정형화 데이터) 기록 용도
CREATE TABLE non_purchase_reasons (
  reason_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fitting_id          UUID NOT NULL REFERENCES fitting_records(fitting_id),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  reason_tag          VARCHAR(20) NOT NULL,
  sub_tag             VARCHAR(30),
  source              VARCHAR(10) DEFAULT 'MANUAL',
  confidence_score    DECIMAL(3,2),
  is_primary          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 5. 고객 취향 프로필 테이블 (customer_preferences)
-- 체형, 선호 컬러 등 고객 고유의 선호도와 특징을 장기 저장하기 위한 용도
CREATE TABLE customer_preferences (
  preference_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  pref_category       VARCHAR(20) NOT NULL,
  pref_value          VARCHAR(30) NOT NULL,
  source              VARCHAR(10) DEFAULT 'MANUAL',
  confidence_score    DECIMAL(3,2),
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 6. 비정형 메모 테이블 (interaction_memos)
-- 판매 사원이 고객과의 대화 맥락이나 구체적 상황을 서술형으로 묘사한 텍스트 데이터 보관 용도
CREATE TABLE interaction_memos (
  memo_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  fitting_id          UUID REFERENCES fitting_records(fitting_id),
  input_type          VARCHAR(10) NOT NULL,
  raw_text            TEXT NOT NULL,
  ner_entities        JSONB,
  sentiment_level     VARCHAR(5),
  intent_tags         VARCHAR(30)[],
  sllm_extracted_tags JSONB,
  sllm_confidence     DECIMAL(3,2),
  staff_confirmed     BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 7. 후속 액션 테이블 (follow_up_actions)
-- 재입고 연락, 사이즈 교환 문의 안내 등 차후에 수행해야 할 고객 관리 액션을 예약하는 용도
CREATE TABLE follow_up_actions (
  action_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  action_type         VARCHAR(20) NOT NULL,
  action_status       VARCHAR(15) DEFAULT 'SCHEDULED',
  scheduled_at        TIMESTAMP,
  executed_at         TIMESTAMP,
  result              VARCHAR(15),
  message_content     TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 8. 고객 만족도 VoC 테이블 (customer_voc)
-- 판매 사원 관찰 기반 결제 시 체감된 고객의 매장 경험 별점과 관련 키워드, 상세 코멘트 보관 용도
CREATE TABLE customer_voc (
  voc_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES visit_sessions(session_id),
  customer_id         UUID NOT NULL REFERENCES customers(customer_id),
  staff_id            UUID NOT NULL,
  satisfaction_score  SMALLINT NOT NULL CHECK (satisfaction_score BETWEEN 1 AND 5),
  experience_tags     VARCHAR(20)[],
  customer_comment    TEXT,
  voc_source          VARCHAR(10) DEFAULT 'STAFF_OBS',
  comment_sentiment   VARCHAR(10),
  improvement_tags    VARCHAR(30)[],
  created_at          TIMESTAMP DEFAULT NOW()
);

-- 9. KPI 일별 스냅샷 테이블 (daily_kpi_snapshots)
-- 매장별로 매일 집계된 7대 핵심 성과 지표를 스냅샷 형태로 기록하여 DID(이중차분법) 분석에 활용하는 용도
CREATE TABLE daily_kpi_snapshots (
  snapshot_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date       DATE NOT NULL,
  store_code          VARCHAR(20) NOT NULL,
  is_treatment        BOOLEAN NOT NULL,
  total_visitors      INTEGER DEFAULT 0,
  new_visitors        INTEGER DEFAULT 0,
  revisitors          INTEGER DEFAULT 0,
  total_purchases     INTEGER DEFAULT 0,
  repurchases         INTEGER DEFAULT 0,
  total_revenue       BIGINT DEFAULT 0,
  new_memberships     INTEGER DEFAULT 0,
  loyal_customer_avg_spend BIGINT DEFAULT 0,
  non_purchase_data_count INTEGER DEFAULT 0,
  avg_satisfaction    DECIMAL(3,2),
  voc_count           INTEGER DEFAULT 0,
  fitting_count       INTEGER DEFAULT 0,
  fitting_conversion_rate DECIMAL(5,4),
  system_usage_rate   DECIMAL(5,4),
  staff_input_count   INTEGER DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE(snapshot_date, store_code)
);

```

---

## 💻 소스 코드 전체


### 📁 Directory: backend/src

### 📄 backend/src/app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { SessionsModule } from './sessions/sessions.module';
import { FittingsModule } from './fittings/fittings.module';
import { VocModule } from './voc/voc.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { MemosModule } from './memos/memos.module';
import { SllmService } from './sllm/sllm.service';
import { KpiModule } from './kpi/kpi.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                type: 'postgres',
                url: cfg.get('DATABASE_URL'),
                ssl: cfg.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                autoLoadEntities: true,
                synchronize: true, // PoC 단계에서만 true. 운영 시 false로 전환
            }),
        }),
        AuthModule,
        CustomersModule,
        SessionsModule,
        FittingsModule,
        VocModule,
        DashboardModule,
        MemosModule,
        KpiModule,
    ],
    providers: [SllmService],
})
export class AppModule { }

```

### 📄 backend/src/auth/auth.controller.ts
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() body: { email: string; password: string; staff_name: string; store_code: string; role?: string }) {
        return this.authService.register(body.email, body.password, body.staff_name, body.store_code, body.role);
    }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }
}

```

### 📄 backend/src/auth/auth.module.ts
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Staff } from '../entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        TypeOrmModule.forFeature([Staff]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                secret: cfg.get('JWT_SECRET', 'rs_jwt_secret'),
                signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN', '24h') },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule { }

```

### 📄 backend/src/auth/auth.service.ts
```typescript
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

```

### 📄 backend/src/auth/jwt.strategy.ts
```typescript
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

```

### 📄 backend/src/customers/customers.controller.ts
```typescript
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
    constructor(private customersService: CustomersService) { }

    @Get('lookup')
    lookup(@Query('phone_last4') phone: string, @Query('gender') gender?: string, @Query('age_group') age?: string) {
        return this.customersService.lookup(phone, gender, age);
    }

    @Get(':id/profile-card')
    getProfileCard(@Param('id') id: string) {
        return this.customersService.getProfileCard(id);
    }

    @Get(':id/preferences')
    getPreferences(@Param('id') id: string) {
        return this.customersService.getPreferences(id);
    }

    @Patch(':id/preferences')
    updatePreferences(
        @Param('id') id: string,
        @Body() body: { session_id: string; preferences: { pref_category: string; pref_value: string; source?: string }[] },
    ) {
        return this.customersService.upsertPreferences(id, body.session_id, body.preferences);
    }

    @Post(':id/membership')
    joinMembership(@Param('id') id: string) {
        return this.customersService.joinMembership(id);
    }
}

```

### 📄 backend/src/customers/customers.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, CustomerPreference } from '../entities';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Customer, CustomerPreference])],
    providers: [CustomersService],
    controllers: [CustomersController],
    exports: [CustomersService],
})
export class CustomersModule { }

```

### 📄 backend/src/customers/customers.service.ts
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerPreference } from '../entities';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(CustomerPreference) private prefRepo: Repository<CustomerPreference>,
    ) { }

    /** 전화번호 뒷4자리로 고객 검색 (중복 방지용 fuzzy matching 포함) */
    async lookup(phoneLast4: string, gender?: string, ageGroup?: string) {
        const where: any = { phone_last4: phoneLast4 };
        if (gender) where.gender = gender;
        if (ageGroup) where.age_group = ageGroup;
        return this.customerRepo.find({ where, order: { updated_at: 'DESC' }, take: 5 });
    }

    /** 신규 고객 생성 또는 기존 고객 반환 (Deduplication) */
    async findOrCreate(data: { phone_last4?: string; gender: string; age_group: string }) {
        if (data.phone_last4) {
            const existing = await this.customerRepo.findOne({
                where: { phone_last4: data.phone_last4, gender: data.gender, age_group: data.age_group },
            });
            if (existing) {
                existing.total_visit_count += 1;
                existing.updated_at = new Date();
                return this.customerRepo.save(existing);
            }
        }
        const customer = this.customerRepo.create({
            ...data,
            first_visit_at: new Date(),
        });
        return this.customerRepo.save(customer);
    }

    /** 고객 프로필 카드 (재방문 시 표시) */
    async getProfileCard(customerId: string) {
        const customer = await this.customerRepo.findOne({
            where: { customer_id: customerId },
            relations: ['sessions'],
        });
        if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다.');

        const preferences = await this.prefRepo.find({
            where: { customer_id: customerId },
            order: { created_at: 'DESC' },
        });

        // Group preferences by category
        const prefMap: Record<string, string[]> = {};
        preferences.forEach(p => {
            if (!prefMap[p.pref_category]) prefMap[p.pref_category] = [];
            if (!prefMap[p.pref_category].includes(p.pref_value)) {
                prefMap[p.pref_category].push(p.pref_value);
            }
        });

        return {
            customer_id: customer.customer_id,
            gender: customer.gender,
            age_group: customer.age_group,
            membership_status: customer.membership_status,
            total_visit_count: customer.total_visit_count,
            total_purchase_count: customer.total_purchase_count,
            total_purchase_amount: customer.total_purchase_amount,
            first_visit_at: customer.first_visit_at,
            preferences: prefMap,
            recent_sessions: (customer.sessions || []).slice(0, 3),
        };
    }

    /** 멤버십 가입 처리 (KPI4) */
    async joinMembership(customerId: string) {
        const customer = await this.customerRepo.findOne({ where: { customer_id: customerId } });
        if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다.');
        customer.membership_status = 'MEMBER';
        customer.membership_joined_at = new Date();
        return this.customerRepo.save(customer);
    }

    /** 취향 태그 조회 */
    async getPreferences(customerId: string) {
        return this.prefRepo.find({ where: { customer_id: customerId }, order: { created_at: 'DESC' } });
    }

    /** 취향 태그 추가/업데이트 */
    async upsertPreferences(customerId: string, sessionId: string, prefs: { pref_category: string; pref_value: string; source?: string }[]) {
        const entities = prefs.map(p => this.prefRepo.create({
            customer_id: customerId,
            session_id: sessionId,
            ...p,
        }));
        return this.prefRepo.save(entities);
    }
}

```

### 📄 backend/src/dashboard/dashboard.controller.ts
```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get('stores')
    getStores() {
        return this.dashboardService.getStores();
    }

    @Get('store/:code/daily')
    getStoreDailyKpi(@Param('code') code: string, @Query('date') date: string) {
        return this.dashboardService.getStoreDailyKpi(code, date);
    }

    @Get('store/:code/weekly')
    getStoreWeeklyReport(@Param('code') code: string) {
        return this.dashboardService.getStoreWeeklyReport(code);
    }

    @Get('hq/kpi-summary')
    getHqKpiSummary() {
        return this.dashboardService.getHqKpiSummary();
    }

    @Get('hq/non-purchase')
    getNonPurchaseAnalysis(@Query('store_code') storeCode?: string) {
        return this.dashboardService.getNonPurchaseAnalysis(storeCode);
    }

    @Get('hq/voc-analysis')
    getVocAnalysis(@Query('store_code') storeCode?: string) {
        return this.dashboardService.getVocAnalysis(storeCode);
    }

    @Get('seller/:staffId/stats')
    getSellerDailyStats(@Param('staffId') staffId: string) {
        return this.dashboardService.getSellerDailyStats(staffId);
    }

    @Get('manager/:code/dashboard')
    getManagerDailyDashboard(@Param('code') code: string) {
        return this.dashboardService.getManagerDailyDashboard(code);
    }
}

```

### 📄 backend/src/dashboard/dashboard.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import {
    DailyKpiSnapshot,
    VisitSession,
    FittingRecord,
    NonPurchaseReason,
    CustomerVoc,
    Store,
    Staff
} from '../entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DailyKpiSnapshot,
            VisitSession,
            FittingRecord,
            NonPurchaseReason,
            CustomerVoc,
            Store,
            Staff
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }

```

### 📄 backend/src/dashboard/dashboard.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
    DailyKpiSnapshot,
    VisitSession,
    FittingRecord,
    NonPurchaseReason,
    CustomerVoc,
    Store,
    Staff,
} from '../entities';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(DailyKpiSnapshot) private kpiRepo: Repository<DailyKpiSnapshot>,
        @InjectRepository(VisitSession) private sessionRepo: Repository<VisitSession>,
        @InjectRepository(FittingRecord) private fittingRepo: Repository<FittingRecord>,
        @InjectRepository(NonPurchaseReason) private reasonRepo: Repository<NonPurchaseReason>,
        @InjectRepository(CustomerVoc) private vocRepo: Repository<CustomerVoc>,
        @InjectRepository(Store) private storeRepo: Repository<Store>,
        @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    ) { }

    /** 매장 일일 KPI */
    async getStoreDailyKpi(storeCode: string, date: string) {
        return this.kpiRepo.findOne({ where: { store_code: storeCode, snapshot_date: date } });
    }

    /** 매장 주간 리포트 */
    async getStoreWeeklyReport(storeCode: string) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return this.kpiRepo.find({
            where: {
                store_code: storeCode,
                snapshot_date: Between(weekAgo.toISOString().slice(0, 10), today.toISOString().slice(0, 10)),
            },
            order: { snapshot_date: 'ASC' },
        });
    }

    /** 본사 KPI 요약 (Treatment vs Control) */
    async getHqKpiSummary() {
        const treatmentKpi = await this.kpiRepo
            .createQueryBuilder('k')
            .where('k.is_treatment = :t', { t: true })
            .select([
                'SUM(k.total_visitors) as total_visitors',
                'SUM(k.revisitors) as revisitors',
                'SUM(k.total_purchases) as total_purchases',
                'SUM(k.repurchases) as repurchases',
                'SUM(k.total_revenue) as total_revenue',
                'SUM(k.new_memberships) as new_memberships',
                'AVG(k.avg_satisfaction) as avg_satisfaction',
                'SUM(k.non_purchase_data_count) as non_purchase_data_count',
            ])
            .getRawOne();

        const controlKpi = await this.kpiRepo
            .createQueryBuilder('k')
            .where('k.is_treatment = :t', { t: false })
            .select([
                'SUM(k.total_visitors) as total_visitors',
                'SUM(k.revisitors) as revisitors',
                'SUM(k.total_purchases) as total_purchases',
                'SUM(k.repurchases) as repurchases',
                'SUM(k.total_revenue) as total_revenue',
                'SUM(k.new_memberships) as new_memberships',
                'AVG(k.avg_satisfaction) as avg_satisfaction',
                'SUM(k.non_purchase_data_count) as non_purchase_data_count',
            ])
            .getRawOne();

        return { treatment: treatmentKpi, control: controlKpi };
    }

    /** 미구매 사유 분석 */
    async getNonPurchaseAnalysis(storeCode?: string) {
        const qb = this.reasonRepo
            .createQueryBuilder('r')
            .select('r.reason_tag', 'reason_tag')
            .addSelect('COUNT(*)', 'count')
            .groupBy('r.reason_tag')
            .orderBy('count', 'DESC');

        if (storeCode) {
            qb.innerJoin('visit_sessions', 's', 's.session_id = r.session_id')
                .andWhere('s.store_code = :storeCode', { storeCode });
        }

        return qb.getRawMany();
    }

    /** VoC 분석 */
    async getVocAnalysis(storeCode?: string) {
        const qb = this.vocRepo
            .createQueryBuilder('v')
            .select('AVG(v.satisfaction_score)', 'avg_score')
            .addSelect('COUNT(*)', 'total_count');

        if (storeCode) {
            qb.innerJoin('visit_sessions', 's', 's.session_id = v.session_id')
                .andWhere('s.store_code = :storeCode', { storeCode });
        }

        const result = await qb.getRawOne();
        return result;
    }

    /** 매장 목록 */
    async getStores() {
        return this.storeRepo.find();
    }

    /** 셀러(직원) 일일 성과 (Phase 5) */
    async getSellerDailyStats(staffId: string) {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // 오늘 해당 직원이 담당한 세션 수 (응대한 고객 수)
        const sessions = await this.sessionRepo
            .createQueryBuilder('s')
            .where('s.staff_id = :staffId', { staffId })
            .andWhere('DATE(s.session_start) = :today', { today })
            .getMany();

        const sessionIds = sessions.map(s => s.session_id);

        // 오늘 피팅 건수 및 구매 전환 건수
        let fittingCount = 0;
        let purchaseCount = 0;

        if (sessionIds.length > 0) {
            const fittings = await this.fittingRepo
                .createQueryBuilder('f')
                .where('f.session_id IN (:...sessionIds)', { sessionIds })
                .getMany();

            fittingCount = fittings.length;
            purchaseCount = fittings.filter(f => f.purchase_result === 'PURCHASED').length;
        }

        return {
            today_customers_helped: sessionIds.length,
            today_fittings: fittingCount,
            today_purchases: purchaseCount,
            conversion_rate: fittingCount > 0 ? (purchaseCount / fittingCount * 100).toFixed(1) : '0.0'
        };
    }

    /** 매니저 대시보드 (피팅 전환율 및 일일 핵심 지표) (Phase 5) */
    async getManagerDailyDashboard(storeCode: string) {
        const today = new Date().toISOString().slice(0, 10);

        const sessions = await this.sessionRepo
            .createQueryBuilder('s')
            .where('s.store_code = :storeCode', { storeCode })
            .andWhere('DATE(s.session_start) = :today', { today })
            .getMany();

        const sessionIds = sessions.map(s => s.session_id);
        let fittingCount = 0;
        let purchaseCount = 0;
        let revenue = 0;

        if (sessionIds.length > 0) {
            const fittings = await this.fittingRepo
                .createQueryBuilder('f')
                .where('f.session_id IN (:...sessionIds)', { sessionIds })
                .getMany();

            fittingCount = fittings.length;
            const purchasedFittings = fittings.filter(f => f.purchase_result === 'PURCHASED');
            purchaseCount = purchasedFittings.length;
            revenue = purchasedFittings.reduce((acc, curr) => acc + Number(curr.purchase_amount || 0), 0);
        }

        return {
            date: today,
            total_visitors: sessionIds.length, // 세션 수 기반 방문자 수
            fitting_conversion_funnel: {
                visitors: sessionIds.length,
                fittings: fittingCount,
                purchases: purchaseCount
            },
            total_revenue: revenue
        };
    }
}

```

### 📄 backend/src/entities/customer.entity.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VisitSession } from './visit-session.entity';

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn('uuid') customer_id: string;
    @Column({ nullable: true }) phone_last4: string;
    @Column() gender: string;
    @Column() age_group: string;
    @Column({ default: 'NON_MEMBER' }) membership_status: string;
    @Column({ nullable: true }) membership_joined_at: Date;
    @Column() first_visit_at: Date;
    @Column({ default: 1 }) total_visit_count: number;
    @Column({ default: 0 }) total_purchase_count: number;
    @Column({ type: 'bigint', default: 0 }) total_purchase_amount: number;
    @CreateDateColumn() created_at: Date;
    @UpdateDateColumn() updated_at: Date;

    @OneToMany(() => VisitSession, s => s.customer)
    sessions: VisitSession[];
}

```

### 📄 backend/src/entities/fitting-record.entity.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { VisitSession } from './visit-session.entity';
import { NonPurchaseReason } from './non-purchase-reason.entity';

@Entity('fitting_records')
export class FittingRecord {
    @PrimaryGeneratedColumn('uuid') fitting_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column({ nullable: true }) product_code: string;
    @Column({ nullable: true }) product_category: string;
    @Column({ nullable: true }) fitting_size: string;
    @Column({ nullable: true }) fitting_color: string;
    @Column({ default: true }) did_try_on: boolean;
    @Column() purchase_result: string;
    @Column({ type: 'bigint', nullable: true }) purchase_amount: number;
    @CreateDateColumn() created_at: Date;

    @ManyToOne(() => VisitSession, s => s.fittings)
    @JoinColumn({ name: 'session_id' })
    session: VisitSession;

    @OneToMany(() => NonPurchaseReason, r => r.fitting)
    reasons: NonPurchaseReason[];
}

```

### 📄 backend/src/entities/index.ts
```typescript
export * from './other-entities';

export { Customer } from './customer.entity';
export { VisitSession } from './visit-session.entity';
export { FittingRecord } from './fitting-record.entity';
export { NonPurchaseReason } from './non-purchase-reason.entity';

import {
    CustomerPreference,
    InteractionMemo,
    FollowUpAction,
    CustomerVoc,
    DailyKpiSnapshot,
    Staff,
    Store,
    BaselineMetric
} from './other-entities';

export {
    CustomerPreference,
    InteractionMemo,
    FollowUpAction,
    CustomerVoc,
    DailyKpiSnapshot,
    Staff,
    Store,
    BaselineMetric
};

```

### 📄 backend/src/entities/non-purchase-reason.entity.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FittingRecord } from './fitting-record.entity';

@Entity('non_purchase_reasons')
export class NonPurchaseReason {
    @PrimaryGeneratedColumn('uuid') reason_id: string;
    @Column() fitting_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column() reason_tag: string;
    @Column({ nullable: true }) sub_tag: string;
    @Column({ default: 'MANUAL' }) source: string;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) confidence_score: number;
    @Column({ default: false }) is_primary: boolean;
    @CreateDateColumn() created_at: Date;

    @ManyToOne(() => FittingRecord, f => f.reasons)
    @JoinColumn({ name: 'fitting_id' })
    fitting: FittingRecord;
}

```

### 📄 backend/src/entities/other-entities.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer_preferences')
export class CustomerPreference {
    @PrimaryGeneratedColumn('uuid') preference_id: string;
    @Column() customer_id: string;
    @Column() session_id: string;
    @Column() pref_category: string;
    @Column() pref_value: string;
    @Column({ default: 'MANUAL' }) source: string;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) confidence_score: number;
    @CreateDateColumn() created_at: Date;
}

@Entity('interaction_memos')
export class InteractionMemo {
    @PrimaryGeneratedColumn('uuid') memo_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column({ nullable: true }) fitting_id: string;
    @Column() input_type: string;
    @Column('text') raw_text: string;
    @Column({ type: 'jsonb', nullable: true }) ner_entities: any;
    @Column({ nullable: true }) sentiment_level: string;
    @Column('varchar', { array: true, nullable: true }) intent_tags: string[];
    @Column({ type: 'jsonb', nullable: true }) sllm_extracted_tags: any;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) sllm_confidence: number;
    @Column({ default: false }) staff_confirmed: boolean;
    @CreateDateColumn() created_at: Date;
}

@Entity('follow_up_actions')
export class FollowUpAction {
    @PrimaryGeneratedColumn('uuid') action_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column() action_type: string;
    @Column({ default: 'SCHEDULED' }) action_status: string;
    @Column({ nullable: true }) scheduled_at: Date;
    @Column({ nullable: true }) executed_at: Date;
    @Column({ nullable: true }) result: string;
    @Column({ type: 'text', nullable: true }) message_content: string;
    @CreateDateColumn() created_at: Date;
}

@Entity('customer_voc')
export class CustomerVoc {
    @PrimaryGeneratedColumn('uuid') voc_id: string;
    @Column() session_id: string;
    @Column() customer_id: string;
    @Column() staff_id: string;
    @Column({ type: 'smallint' }) satisfaction_score: number;
    @Column('varchar', { array: true, nullable: true }) experience_tags: string[];
    @Column({ type: 'text', nullable: true }) customer_comment: string;
    @Column({ default: 'STAFF_OBS' }) voc_source: string;
    @Column({ nullable: true }) comment_sentiment: string;
    @Column('varchar', { array: true, nullable: true }) improvement_tags: string[];
    @CreateDateColumn() created_at: Date;
}

@Entity('daily_kpi_snapshots')
export class DailyKpiSnapshot {
    @PrimaryGeneratedColumn('uuid') snapshot_id: string;
    @Column({ type: 'date' }) snapshot_date: string;
    @Column() store_code: string;
    @Column() is_treatment: boolean;
    @Column({ default: 0 }) total_visitors: number;
    @Column({ default: 0 }) new_visitors: number;
    @Column({ default: 0 }) revisitors: number;
    @Column({ default: 0 }) total_purchases: number;
    @Column({ default: 0 }) repurchases: number;
    @Column({ type: 'bigint', default: 0 }) total_revenue: number;
    @Column({ default: 0 }) new_memberships: number;
    @Column({ type: 'bigint', default: 0 }) loyal_customer_avg_spend: number;
    @Column({ default: 0 }) non_purchase_data_count: number;
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true }) avg_satisfaction: number;
    @Column({ default: 0 }) voc_count: number;
    @Column({ default: 0 }) fitting_count: number;
    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true }) fitting_conversion_rate: number;
    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true }) system_usage_rate: number;
    @Column({ default: 0 }) staff_input_count: number;
    @CreateDateColumn() created_at: Date;
}

@Entity('staff')
export class Staff {
    @PrimaryGeneratedColumn('uuid') staff_id: string;
    @Column() staff_name: string;
    @Column({ unique: true }) email: string;
    @Column() password_hash: string;
    @Column() store_code: string;
    @Column({ default: 'SELLER' }) role: string;
    @Column({ default: true }) is_active: boolean;
    @CreateDateColumn() created_at: Date;
}

@Entity('stores')
export class Store {
    @Column({ primary: true }) store_code: string;
    @Column() store_name: string;
    @Column() brand: string;
    @Column({ nullable: true }) location: string;
    @Column({ default: true }) is_treatment: boolean;
    @CreateDateColumn() created_at: Date;
}

@Entity('baseline_metrics')
export class BaselineMetric {
    @Column({ primary: true }) store_code: string;
    @Column({ primary: true }) metric_name: string;
    @Column({ type: 'bigint' }) baseline_value: number;
    @Column({ nullable: true }) baseline_period: string;
    @CreateDateColumn() created_at: Date;
}

```

### 📄 backend/src/entities/visit-session.entity.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';
import { FittingRecord } from './fitting-record.entity';

@Entity('visit_sessions')
export class VisitSession {
    @PrimaryGeneratedColumn('uuid') session_id: string;
    @Column() customer_id: string;
    @Column() store_code: string;
    @Column() staff_id: string;
    @Column() visit_type: string;
    @Column({ nullable: true }) companion_type: string;
    @Column({ nullable: true }) visit_purpose: string;
    @Column() session_start: Date;
    @Column({ nullable: true }) session_end: Date;
    @Column({ nullable: true }) duration_seconds: number;
    @Column({ type: 'smallint', nullable: true }) day_of_week: number;
    @Column({ type: 'smallint', nullable: true }) hour_of_day: number;
    @Column({ default: true }) is_treatment: boolean;
    @CreateDateColumn() created_at: Date;

    @ManyToOne(() => Customer, c => c.sessions)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @OneToMany(() => FittingRecord, f => f.session)
    fittings: FittingRecord[];
}

```

### 📄 backend/src/fittings/fittings.controller.ts
```typescript
import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FittingsService } from './fittings.service';

@Controller('sessions/:sessionId/fittings')
@UseGuards(AuthGuard('jwt'))
export class FittingsController {
    constructor(private fittingsService: FittingsService) { }

    @Post()
    addFitting(@Param('sessionId') sessionId: string, @Body() body: any) {
        return this.fittingsService.addFitting(sessionId, body);
    }

    @Post(':fittingId/reasons')
    addReasons(
        @Param('sessionId') sessionId: string,
        @Param('fittingId') fittingId: string,
        @Body() body: { customer_id: string; reasons: any[] },
    ) {
        return this.fittingsService.addReasons(fittingId, sessionId, body.customer_id, body.reasons);
    }
}

```

### 📄 backend/src/fittings/fittings.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FittingRecord, NonPurchaseReason, Customer } from '../entities';
import { FittingsService } from './fittings.service';
import { FittingsController } from './fittings.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FittingRecord, NonPurchaseReason, Customer])],
    providers: [FittingsService],
    controllers: [FittingsController],
})
export class FittingsModule { }

```

### 📄 backend/src/fittings/fittings.service.ts
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FittingRecord, NonPurchaseReason, Customer } from '../entities';

@Injectable()
export class FittingsService {
    constructor(
        @InjectRepository(FittingRecord) private fittingRepo: Repository<FittingRecord>,
        @InjectRepository(NonPurchaseReason) private reasonRepo: Repository<NonPurchaseReason>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    ) { }

    /** 피팅 기록 추가 */
    async addFitting(sessionId: string, data: {
        customer_id: string;
        product_code?: string;
        product_category?: string;
        fitting_size?: string;
        fitting_color?: string;
        did_try_on?: boolean;
        purchase_result: string;
        purchase_amount?: number;
    }) {
        // Validation: 구매인데 상품코드 없으면 경고
        if (data.purchase_result === 'PURCHASED' && !data.product_code) {
            throw new BadRequestException('구매 기록에는 상품코드가 필요합니다.');
        }

        const fitting = this.fittingRepo.create({
            session_id: sessionId,
            ...data,
        });
        const saved = await this.fittingRepo.save(fitting);

        // 구매 시 고객 통계 업데이트
        if (data.purchase_result === 'PURCHASED') {
            await this.customerRepo.increment({ customer_id: data.customer_id }, 'total_purchase_count', 1);
            if (data.purchase_amount) {
                await this.customerRepo.increment({ customer_id: data.customer_id }, 'total_purchase_amount', data.purchase_amount);
            }
        }

        return saved;
    }

    /** 미구매 사유 태그 추가 (복합 사유 허용) */
    async addReasons(fittingId: string, sessionId: string, customerId: string, reasons: {
        reason_tag: string;
        sub_tag?: string;
        is_primary?: boolean;
        source?: string;
    }[]) {
        if (!reasons || reasons.length === 0) {
            throw new BadRequestException('미구매 시 최소 1개의 사유를 선택해야 합니다.');
        }

        const entities = reasons.map(r => this.reasonRepo.create({
            fitting_id: fittingId,
            session_id: sessionId,
            customer_id: customerId,
            ...r,
        }));
        return this.reasonRepo.save(entities);
    }
}

```

### 📄 backend/src/kpi/kpi.controller.ts
```typescript
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KpiService } from './kpi.service';

@Controller('api/kpi')
// @UseGuards(AuthGuard('jwt'))
export class KpiController {
    constructor(private readonly kpiService: KpiService) { }

    @Post('generate-snapshot/:dateStr')
    async generateDailySnapshot(@Param('dateStr') dateStr: string) {
        return this.kpiService.generateDailySnapshot(dateStr);
    }

    @Get('did-analysis')
    async getDidAnalysis(@Query('metric') metric: string = 'loyal_customer_avg_spend') {
        return this.kpiService.getDidAnalysis(metric);
    }
}

```

### 📄 backend/src/kpi/kpi.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpiService } from './kpi.service';
import { KpiController } from './kpi.controller';
import { DailyKpiSnapshot, Store, BaselineMetric } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([DailyKpiSnapshot, Store, BaselineMetric])],
  providers: [KpiService],
  controllers: [KpiController]
})
export class KpiModule { }

```

### 📄 backend/src/kpi/kpi.service.ts
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyKpiSnapshot, Store, BaselineMetric } from '../entities';

@Injectable()
export class KpiService {
    private readonly logger = new Logger(KpiService.name);

    constructor(
        @InjectRepository(DailyKpiSnapshot) private kpiRepo: Repository<DailyKpiSnapshot>,
        @InjectRepository(Store) private storeRepo: Repository<Store>,
        @InjectRepository(BaselineMetric) private baselineRepo: Repository<BaselineMetric>
    ) { }

    /** Phase 6: Daily KPI Batch Job (Mock Implementation) */
    async generateDailySnapshot(dateStr: string) {
        this.logger.log(`⏳ Starting daily KPI snapshot generation for ${dateStr}...`);

        const stores = await this.storeRepo.find();
        const snapshots: DailyKpiSnapshot[] = [];

        for (const store of stores) {
            // Check if snapshot already exists
            const existing = await this.kpiRepo.findOne({ where: { store_code: store.store_code, snapshot_date: dateStr } });
            if (existing) {
                this.logger.warn(`Snapshot for ${store.store_code} on ${dateStr} already exists. Skipping.`);
                continue;
            }

            // MOCK: Generate semi-random realistic data based on whether it's treatment or control
            const multiplier = store.is_treatment ? 1.2 : 1.0;
            const visitorCount = Math.floor((Math.random() * 50 + 100) * multiplier); // 100 ~ 150
            const purchases = Math.floor(visitorCount * 0.3); // 30% conversion

            const snapshot = this.kpiRepo.create({
                snapshot_date: dateStr,
                store_code: store.store_code,
                is_treatment: store.is_treatment,
                total_visitors: visitorCount,
                new_visitors: Math.floor(visitorCount * 0.4),
                revisitors: Math.floor(visitorCount * 0.6),
                total_purchases: purchases,
                repurchases: Math.floor(purchases * 0.5),
                total_revenue: purchases * 120000,
                new_memberships: Math.floor(purchases * 0.2),
                loyal_customer_avg_spend: Math.floor(150000 * multiplier),
                non_purchase_data_count: visitorCount - purchases,
                avg_satisfaction: parseFloat((Math.random() * 1 + 4).toFixed(2)), // 4.0 ~ 5.0
                voc_count: Math.floor(visitorCount * 0.1),
                fitting_count: Math.floor(visitorCount * 0.8),
                fitting_conversion_rate: purchases / Math.max(1, Math.floor(visitorCount * 0.8)),
                system_usage_rate: store.is_treatment ? 0.95 : 0.0,
                staff_input_count: store.is_treatment ? visitorCount * 2 : 0,
            });

            snapshots.push(snapshot);
        }

        if (snapshots.length > 0) {
            await this.kpiRepo.save(snapshots);
            this.logger.log(`✅ Generated ${snapshots.length} snapshots successfully.`);
        }

        return { message: 'Snapshot generation complete', count: snapshots.length };
    }

    /** Phase 6: DID Regression Analysis */
    async getDidAnalysis(targetMetric: string) {
        // PoC started theoretically 2 weeks ago (for mocking purposes)
        // DID Formula: (Treatment_Post - Treatment_Pre) - (Control_Post - Control_Pre)

        // 1. Get baseline (Pre-PoC) averages from BaselineMetric for treatment and control
        const baselines = await this.baselineRepo.find({ where: { metric_name: targetMetric } });

        let treatPreSum = 0, treatPreCount = 0;
        let ctrlPreSum = 0, ctrlPreCount = 0;

        // Map baselines
        const storeMap = new Map();
        const stores = await this.storeRepo.find();
        stores.forEach(s => storeMap.set(s.store_code, s.is_treatment));

        baselines.forEach(b => {
            const isTreat = storeMap.get(b.store_code);
            if (isTreat) {
                treatPreSum += Number(b.baseline_value);
                treatPreCount++;
            } else {
                ctrlPreSum += Number(b.baseline_value);
                ctrlPreCount++;
            }
        });

        // If no baselines, mock them
        const treatPre = treatPreCount > 0 ? (treatPreSum / treatPreCount) : 100;
        const ctrlPre = ctrlPreCount > 0 ? (ctrlPreSum / ctrlPreCount) : 100;

        // 2. Get Post-PoC averages from DailyKpiSnapshot
        const postData = await this.kpiRepo
            .createQueryBuilder('k')
            .select('k.is_treatment', 'is_treatment')
            .addSelect(`AVG(k.${targetMetric})`, 'avg_val')
            .groupBy('k.is_treatment')
            .getRawMany();

        let treatPost = 0;
        let ctrlPost = 0;

        postData.forEach(p => {
            if (p.is_treatment) treatPost = Number(p.avg_val);
            else ctrlPost = Number(p.avg_val);
        });

        // 3. Calculate DID
        const diffTreat = treatPost - treatPre;
        const diffCtrl = ctrlPost - ctrlPre;
        const didEstimator = diffTreat - diffCtrl;

        // Mock p-value calculation (typically requires individual level data running OLS)
        const pValue = didEstimator > 0 ? 0.03 : 0.45;

        return {
            metric: targetMetric,
            pre_poc: {
                treatment: treatPre.toFixed(2),
                control: ctrlPre.toFixed(2)
            },
            post_poc: {
                treatment: treatPost.toFixed(2),
                control: ctrlPost.toFixed(2)
            },
            did_estimator: didEstimator.toFixed(2),
            p_value: pValue,
            is_significant: pValue < 0.05
        };
    }
}

```

### 📄 backend/src/main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors({ origin: '*' });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🛍️ Retail Sync API running on port ${port}/api`);
}
bootstrap();

```

### 📄 backend/src/memos/memos.controller.ts
```typescript
import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemosService } from './memos.service';

@Controller('api/memos')
@UseGuards(AuthGuard('jwt'))
export class MemosController {
    constructor(private readonly memosService: MemosService) { }

    @Post(':sessionId')
    async createMemo(
        @Param('sessionId') sessionId: string,
        @Body() body: { customer_id: string; fitting_id?: string; input_type: 'TEXT' | 'AUDIO'; text: string }
    ) {
        return this.memosService.createMemo(
            sessionId,
            body.customer_id,
            body.input_type,
            body.text,
            body.fitting_id
        );
    }
}

```

### 📄 backend/src/memos/memos.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemosService } from './memos.service';
import { MemosController } from './memos.controller';
import { InteractionMemo } from '../entities';
import { SllmService } from '../sllm/sllm.service';

@Module({
  imports: [TypeOrmModule.forFeature([InteractionMemo])],
  providers: [MemosService, SllmService],
  controllers: [MemosController]
})
export class MemosModule { }

```

### 📄 backend/src/memos/memos.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteractionMemo } from '../entities/other-entities';
import { SllmService } from '../sllm/sllm.service';

@Injectable()
export class MemosService {
    constructor(
        @InjectRepository(InteractionMemo)
        private memoRepo: Repository<InteractionMemo>,
        private sllmService: SllmService
    ) { }

    async createMemo(sessionId: string, customerId: string, inputType: 'TEXT' | 'AUDIO', textToProcess: string, fittingId?: string) {
        let rawText = textToProcess;

        if (inputType === 'AUDIO') {
            // In a real scenario, textToProcess would be base64 audio data.
            // Here we simulate the STT process.
            rawText = await this.sllmService.convertSpeechToText(Buffer.from(textToProcess));
        }

        // Run the sLLM pipeline
        const sllmResults = await this.sllmService.processTextPipeline(rawText);

        // Create and save the memo entity
        const memo = this.memoRepo.create({
            session_id: sessionId,
            customer_id: customerId,
            fitting_id: fittingId,
            input_type: inputType,
            raw_text: sllmResults.raw_text,
            ner_entities: sllmResults.ner_entities,
            sentiment_level: sllmResults.sentiment_level,
            intent_tags: sllmResults.intent_tags,
            sllm_extracted_tags: sllmResults.sllm_extracted_tags,
            sllm_confidence: sllmResults.sllm_confidence,
            staff_confirmed: false // Can be confirmed later in the UI
        });

        return await this.memoRepo.save(memo);
    }
}

```

### 📄 backend/src/sessions/sessions.controller.ts
```typescript
import { Controller, Post, Patch, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(AuthGuard('jwt'))
export class SessionsController {
    constructor(private sessionsService: SessionsService) { }

    @Post()
    create(@Req() req, @Body() body: any) {
        return this.sessionsService.createSession({
            store_code: req.user.store_code,
            staff_id: req.user.staff_id,
            is_treatment: body.is_treatment ?? true,
            customer: body.customer,
            visit_type: body.visit_type,
            companion_type: body.companion_type,
            visit_purpose: body.visit_purpose,
        });
    }

    @Patch(':id')
    end(@Param('id') id: string) {
        return this.sessionsService.endSession(id);
    }

    @Get('latest')
    getLatest(@Req() req) {
        return this.sessionsService.getLatestSession(req.user.staff_id);
    }

    @Get(':id')
    get(@Param('id') id: string) {
        return this.sessionsService.getSession(id);
    }

    @Post(':id/memos')
    addMemo(@Param('id') id: string, @Body() body: any) {
        return this.sessionsService.addMemo(id, body);
    }

    @Post(':id/voc')
    addVoc(@Param('id') id: string, @Body() body: any) {
        return this.sessionsService.addVoc(id, body);
    }

    @Post(':id/follow-ups')
    addFollowUp(@Param('id') id: string, @Body() body: any) {
        return this.sessionsService.addFollowUp(id, body);
    }
}

```

### 📄 backend/src/sessions/sessions.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitSession, InteractionMemo, FollowUpAction, CustomerVoc } from '../entities';
import { CustomersModule } from '../customers/customers.module';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([VisitSession, InteractionMemo, FollowUpAction, CustomerVoc]),
        CustomersModule,
    ],
    providers: [SessionsService],
    controllers: [SessionsController],
    exports: [SessionsService],
})
export class SessionsModule { }

```

### 📄 backend/src/sessions/sessions.service.ts
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitSession, InteractionMemo, FollowUpAction, CustomerVoc } from '../entities';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(VisitSession) private sessionRepo: Repository<VisitSession>,
        @InjectRepository(InteractionMemo) private memoRepo: Repository<InteractionMemo>,
        @InjectRepository(FollowUpAction) private followUpRepo: Repository<FollowUpAction>,
        @InjectRepository(CustomerVoc) private vocRepo: Repository<CustomerVoc>,
        private customersService: CustomersService,
    ) { }

    /** 새 접객 세션 시작 */
    async createSession(data: {
        store_code: string;
        staff_id: string;
        is_treatment: boolean;
        customer: { phone_last4?: string; gender: string; age_group: string };
        visit_type: string;
        companion_type?: string;
        visit_purpose?: string;
    }) {
        // Find or create customer (dedup)
        const customer = await this.customersService.findOrCreate(data.customer);

        const now = new Date();
        const session = this.sessionRepo.create({
            customer_id: customer.customer_id,
            store_code: data.store_code,
            staff_id: data.staff_id,
            visit_type: data.visit_type,
            companion_type: data.companion_type,
            visit_purpose: data.visit_purpose,
            session_start: now,
            day_of_week: now.getDay() === 0 ? 6 : now.getDay() - 1, // Mon=0 ... Sun=6
            hour_of_day: now.getHours(),
            is_treatment: data.is_treatment,
        });

        const saved = await this.sessionRepo.save(session);
        return { ...saved, customer };
    }

    /** 세션 종료 (duration 자동 계산) */
    async endSession(sessionId: string) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

        const now = new Date();
        session.session_end = now;
        session.duration_seconds = Math.floor((now.getTime() - new Date(session.session_start).getTime()) / 1000);
        return this.sessionRepo.save(session);
    }

    /** 자유 메모 추가 */
    async addMemo(sessionId: string, data: {
        customer_id: string;
        fitting_id?: string;
        input_type: string;
        raw_text: string;
    }) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

        const memo = this.memoRepo.create({
            session_id: sessionId,
            customer_id: data.customer_id,
            fitting_id: data.fitting_id,
            input_type: data.input_type,
            raw_text: data.raw_text,
            // sLLM processing will be triggered asynchronously in Phase 4
        });
        return this.memoRepo.save(memo);
    }

    /** VoC 관찰 기록 추가 */
    async addVoc(sessionId: string, data: {
        customer_id: string;
        staff_id: string;
        satisfaction_score: number;
        experience_tags?: string[];
        customer_comment?: string;
        voc_source?: string;
    }) {
        const session = await this.sessionRepo.findOne({ where: { session_id: sessionId } });
        if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

        const voc = this.vocRepo.create({
            session_id: sessionId,
            ...data,
        });
        return this.vocRepo.save(voc);
    }

    /** 후속 액션 예약 */
    async addFollowUp(sessionId: string, data: {
        customer_id: string;
        action_type: string;
        scheduled_at?: Date;
        message_content?: string;
    }) {
        const followUp = this.followUpRepo.create({
            session_id: sessionId,
            ...data,
        });
        return this.followUpRepo.save(followUp);
    }

    /** 세션 조회 (with relations) */
    async getSession(sessionId: string) {
        return this.sessionRepo.findOne({
            where: { session_id: sessionId },
            relations: ['customer', 'fittings', 'fittings.reasons'],
        });
    }

    /** 최근 활성 세션 폴링용 */
    async getLatestSession(staffId: string) {
        return this.sessionRepo.findOne({
            where: { staff_id: staffId },
            order: { session_start: 'DESC' },
            relations: ['customer', 'fittings', 'fittings.reasons'],
        });
    }
}

```

### 📄 backend/src/sllm/sllm.service.ts
```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SllmService {
    private readonly logger = new Logger(SllmService.name);

    // Phase 4: Stage 1 - Speech to Text Placeholder (RTZR API stub)
    async convertSpeechToText(audioData: Buffer): Promise<string> {
        this.logger.log('🎙️ [STT] Processing audio data through RTZR API stub...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        return "이거 입어봤는데 핏은 오버핏이라 좋은데 컬러가 제 웜톤에는 좀 안 맞는 것 같아요. 조금 더 밝은 색으로 다시 볼게요.";
    }

    // Phase 4: Stage 2 - sLLM 3-stage Processing Pipeline
    async processTextPipeline(text: string) {
        this.logger.log(`🤖 [sLLM] Starting 3-stage processing for text: "${text}"`);

        // Stage 1: NER (Named Entity Recognition) - identifying key entities
        const nerStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        const ner_entities = {
            product_attributes: ['오버핏', '밝은 색'],
            customer_attributes: ['웜톤'],
            action: ['다시 보기']
        };
        this.logger.debug(`[sLLM Stage 1] NER Extraction complete (${Date.now() - nerStartTime}ms)`);

        // Stage 2: Sentiment Analysis - positive, negative, neutral
        const sentimentStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 200));
        // Simulated logic: text contains '안 맞는' -> slightly negative about color, but positive about fit. Overall mixed/neutral.
        const sentiment_level = text.includes('안 맞는') ? 'MIXED' : 'POSITIVE';
        this.logger.debug(`[sLLM Stage 2] Sentiment Analysis complete: ${sentiment_level} (${Date.now() - sentimentStartTime}ms)`);

        // Stage 3: Intent Classification - what does the customer want to do?
        const intentStartTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 300));
        const intent_tags = ['RETRY_DIFFERENT_COLOR', 'CONSIDERING_PURCHASE'];
        this.logger.debug(`[sLLM Stage 3] Intent Classification complete (${Date.now() - intentStartTime}ms)`);

        // Simulated Tag Extraction (mapping to system tags)
        const sllm_extracted_tags = {
            mismatch_reason: 'COLOR',
            preference_fit: 'OVERFIT',
            preference_tone: 'WARM'
        };

        return {
            raw_text: text,
            ner_entities,
            sentiment_level,
            intent_tags,
            sllm_extracted_tags,
            sllm_confidence: parseFloat((Math.random() * (0.98 - 0.85) + 0.85).toFixed(2)) // 85% ~ 98% confidence
        };
    }

    // Phase 4: Stage 3 - Tag merge logic (Manual PRIMARY + sLLM, conflict resolution)
    mergeTags(manualTags: Record<string, any>, sllmTags: Record<string, any>) {
        this.logger.log('🔄 [sLLM] Merging manual tags with sLLM extracted tags...');
        const merged = { ...sllmTags };
        const conflicts: any[] = [];

        for (const [key, value] of Object.entries(manualTags)) {
            if (merged[key] && merged[key] !== value) {
                conflicts.push({ key, manual: value, sllm: merged[key] });
                this.logger.warn(`⚠️ Conflict on tag [${key}]: Manual=${value} vs sLLM=${merged[key]}. manual wins.`);
            }
            // Manual tags always take precedence
            merged[key] = value;
        }

        return {
            merged_tags: merged,
            conflicts_resolved: conflicts.length,
            conflict_details: conflicts
        };
    }
}

```

### 📄 backend/src/voc/voc.controller.ts
```typescript
import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VocService } from './voc.service';

@Controller('sessions/:sessionId/voc')
@UseGuards(AuthGuard('jwt'))
export class VocController {
    constructor(private vocService: VocService) { }

    @Post()
    recordVoc(@Param('sessionId') sessionId: string, @Req() req, @Body() body: any) {
        return this.vocService.recordVoc(sessionId, {
            ...body,
            staff_id: req.user.staff_id,
        });
    }
}

```

### 📄 backend/src/voc/voc.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerVoc } from '../entities';
import { VocService } from './voc.service';
import { VocController } from './voc.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CustomerVoc])],
    providers: [VocService],
    controllers: [VocController],
})
export class VocModule { }

```

### 📄 backend/src/voc/voc.service.ts
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerVoc } from '../entities';

@Injectable()
export class VocService {
    constructor(
        @InjectRepository(CustomerVoc) private vocRepo: Repository<CustomerVoc>,
    ) { }

    /** 고객 만족도 VoC 기록 (KPI7) */
    async recordVoc(sessionId: string, data: {
        customer_id: string;
        staff_id: string;
        satisfaction_score: number;
        experience_tags?: string[];
        customer_comment?: string;
        voc_source?: string;
    }) {
        if (data.satisfaction_score < 1 || data.satisfaction_score > 5) {
            throw new BadRequestException('만족도 점수는 1~5 사이여야 합니다.');
        }

        let comment_sentiment: string | null = null;
        let improvement_tags: string[] | null = null;

        // Phase 4: Mock VoC Sentiment Analysis
        if (data.customer_comment && data.customer_comment.length > 5) {
            const comment = data.customer_comment;
            if (comment.includes('최고') || comment.includes('좋') || comment.includes('친절')) {
                comment_sentiment = 'POSITIVE';
            } else if (comment.includes('불만') || comment.includes('별로') || comment.includes('안')) {
                comment_sentiment = 'NEGATIVE';
                improvement_tags = ['SERVICE', 'WAITING_TIME']; // mock inference
            } else {
                comment_sentiment = 'NEUTRAL';
            }
        }

        const voc = this.vocRepo.create({
            session_id: sessionId,
            comment_sentiment,
            improvement_tags,
            ...data,
        } as any);
        return this.vocRepo.save(voc);
    }

    /** 매장별 평균 만족도 조회 */
    async getStoreAvgSatisfaction(storeCode: string) {
        const result = await this.vocRepo
            .createQueryBuilder('v')
            .innerJoin('visit_sessions', 's', 's.session_id = v.session_id')
            .where('s.store_code = :storeCode', { storeCode })
            .select('AVG(v.satisfaction_score)', 'avg_score')
            .addSelect('COUNT(*)', 'total_count')
            .getRawOne();
        return result;
    }
}

```

### 📄 backend/package.json
```json
{
    "name": "retail-sync-backend",
    "version": "0.1.0",
    "description": "Retail Sync 2nd PoC Backend API",
    "private": true,
    "scripts": {
        "build": "nest build",
        "start": "nest start",
        "start:dev": "nest start --watch",
        "start:prod": "node dist/main"
    },
    "dependencies": {
        "@nestjs/common": "^10.0.0",
        "@nestjs/core": "^10.0.0",
        "@nestjs/platform-express": "^10.0.0",
        "@nestjs/typeorm": "^10.0.0",
        "@nestjs/config": "^3.0.0",
        "@nestjs/jwt": "^10.0.0",
        "@nestjs/passport": "^10.0.0",
        "typeorm": "^0.3.17",
        "pg": "^8.11.0",
        "passport": "^0.6.0",
        "passport-jwt": "^4.0.1",
        "bcrypt": "^5.1.0",
        "class-validator": "^0.14.0",
        "class-transformer": "^0.5.1",
        "reflect-metadata": "^0.1.13",
        "rxjs": "^7.8.0",
        "uuid": "^9.0.0"
    },
    "devDependencies": {
        "@nestjs/cli": "^10.0.0",
        "@types/node": "^20.0.0",
        "@types/bcrypt": "^5.0.0",
        "@types/passport-jwt": "^3.0.0",
        "typescript": "^5.1.0",
        "ts-node": "^10.9.0"
    }
}
```


### 📁 Directory: frontend/src

### 📄 frontend/src/App.jsx
```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import InputScreen from './screens/InputScreen';
import MemoScreen from './screens/MemoScreen';
import StoreDashboardScreen from './screens/StoreDashboardScreen';
import HqDashboardScreen from './screens/HqDashboardScreen';
import TopNavigation from './components/TopNavigation';
import StaffLoginGate from './components/StaffLoginGate';

function AppLayout() {
    const location = useLocation();
    const isInputRoute = location.pathname === '/input';

    return (
        <div className={`min-h-screen ${isInputRoute ? 'bg-[#CBD5E1]' : 'bg-surface'}`}>
            {!isInputRoute && <TopNavigation />}
            <main>
                <Routes>
                    <Route path="/input" element={<StaffLoginGate><InputScreen /></StaffLoginGate>} />
                    <Route path="/memo" element={<StaffLoginGate><MemoScreen /></StaffLoginGate>} />
                    <Route path="/store" element={<StoreDashboardScreen />} />
                    <Route path="/hq" element={<HqDashboardScreen />} />
                    <Route path="/" element={<Navigate to="/input" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}

```

### 📄 frontend/src/components/StaffLoginGate.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { Store, User, Activity, CheckCircle2 } from 'lucide-react';

const STAFF_LIST = [
    { id: 'staff-1111-1111-1111-111111111111', name: '김민수' },
    { id: 'staff-2222-2222-2222-222222222222', name: '이서연' },
    { id: 'staff-3333-3333-3333-333333333333', name: '박지훈' },
];

const STORE_INFO = {
    code: 'HYUNDAI_SHINCHON_LACOSTE',
    label: '현대백화점 신촌점 (라코스테)'
};

function StaffLoginScreen({ onLogin }) {
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [isTreatment, setIsTreatment] = useState(true);

    const handleLogin = () => {
        if (!selectedStaffId) {
            alert('판매원(직원)을 선택해주세요.');
            return;
        }

        const selectedStaff = STAFF_LIST.find(s => s.id === selectedStaffId);

        localStorage.setItem('staff_id', selectedStaff.id);
        localStorage.setItem('staff_name', selectedStaff.name);
        localStorage.setItem('store_code', STORE_INFO.code);
        localStorage.setItem('is_treatment', isTreatment ? 'true' : 'false');

        onLogin();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-6 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-borderGray">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <Store size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-textPrimary">Retail Sync 접속</h1>
                    <p className="text-[16px] font-bold text-primary mt-2">{STORE_INFO.label}</p>
                </div>

                <div className="flex flex-col gap-6">
                    {/* 판매자 다건 선택 (클릭) */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[14px] font-bold text-textPrimary">담당자 (직원) 선택</label>
                        <div className="grid grid-cols-3 gap-3">
                            {STAFF_LIST.map(staff => (
                                <button
                                    key={staff.id}
                                    onClick={() => setSelectedStaffId(staff.id)}
                                    className={`relative flex flex-col items-center justify-center h-24 rounded-xl border-2 transition-all tap-active ${selectedStaffId === staff.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-borderGray bg-surface hover:bg-gray-50'
                                        }`}
                                >
                                    {selectedStaffId === staff.id && (
                                        <CheckCircle2 size={16} className="absolute top-2 right-2 text-primary" fill="currentColor" strokeWidth={3} />
                                    )}
                                    <User size={24} className={`mb-2 ${selectedStaffId === staff.id ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className={`text-[15px] font-bold ${selectedStaffId === staff.id ? 'text-primary' : 'text-textPrimary'}`}>
                                        {staff.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 매장 구분 (실험군/대조군) */}
                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-[14px] font-bold text-textPrimary flex items-center gap-1">
                            <Activity size={16} /> 매장 A/B 그룹 (POC 분석용)
                        </label>
                        <div className="flex bg-surface p-1 rounded-xl border border-borderGray">
                            <button
                                onClick={() => setIsTreatment(true)}
                                className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-colors ${isTreatment ? 'bg-white shadow-sm text-primary border border-gray-200' : 'text-gray-500'}`}
                            >
                                실험군 (Treatment)
                            </button>
                            <button
                                onClick={() => setIsTreatment(false)}
                                className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-colors ${!isTreatment ? 'bg-white shadow-sm text-gray-800 border border-gray-200' : 'text-gray-500'}`}
                            >
                                대조군 (Control)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full h-14 bg-primary text-white font-bold text-[16px] rounded-xl mt-4 hover:bg-primary/90 transition-colors tap-active shadow-sm"
                    >
                        로그인 및 시작
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function StaffLoginGate({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Only run on client mount
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('staff_id'));
    }, []);

    if (!isLoggedIn) {
        return <StaffLoginScreen onLogin={() => setIsLoggedIn(true)} />;
    }
    return children;
}

```

### 📄 frontend/src/components/SuccessOverlay.jsx
```javascript
import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function SuccessOverlay() {
    return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center animate-success shadow-2xl">
                <div className="w-20 h-20 bg-accentGreen rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-textPrimary mb-1">기록 완료!</h2>
                <p className="text-textSecondary text-[15px]">접객 데이터가 저장되었습니다</p>
            </div>
        </div>
    );
}

```

### 📄 frontend/src/components/TopNavigation.jsx
```javascript
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Edit3, LayoutDashboard, Building2 } from 'lucide-react';

export default function TopNavigation() {
    return (
        <header className="h-16 bg-primary flex items-center justify-between px-8 text-white min-w-[1024px]">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <BarChart3 size={20} className="text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">Retail Sync Desk</span>
            </div>

            <nav className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <NavLink
                    to="/memo"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10'}`}
                >
                    <Edit3 size={16} /> 노트북 메모
                </NavLink>
                <NavLink
                    to="/store"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10'}`}
                >
                    <LayoutDashboard size={16} /> 매장 대시보드
                </NavLink>
                <NavLink
                    to="/hq"
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${isActive ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10'}`}
                >
                    <Building2 size={16} /> 본사 통합 대시보드
                </NavLink>
            </nav>

            <div className="flex items-center gap-3">
                <span className="text-white/70 text-[14px]">롯데 건대점</span>
                <div className="w-8 h-8 flex items-center justify-center border border-white/30 rounded-full font-bold text-[13px]">
                    JS
                </div>
            </div>
        </header>
    );
}

```

### 📄 frontend/src/index.css
```javascript
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}

html,
body,
#root {
    height: 100%;
    margin: 0;
}

body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #E2E8F0;
    -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
    display: none;
}

input,
button {
    font-family: inherit;
}

/* Tap animation */
@keyframes tapPulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(0.95);
    }

    100% {
        transform: scale(1);
    }
}

.tap-active:active {
    animation: tapPulse 0.15s ease;
}

/* Success animation */
@keyframes successPop {
    0% {
        transform: scale(0);
        opacity: 0;
    }

    60% {
        transform: scale(1.15);
        opacity: 1;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.animate-success {
    animation: successPop 0.5s ease-out;
}

/* Slide up */
@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.animate-slide-up {
    animation: slideUp 0.3s ease-out;
}
```

### 📄 frontend/src/main.jsx
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

```

### 📄 frontend/src/screens/HqDashboardScreen.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { apiClient } from '../services/apiClient';

// Mock Data for specific complex visualizations requested that don't have endpoints in Phase 1
const MOCK_HEATMAP = [
    { name: '강남점 (T)', 가격: 45, 사이즈: 30, 컬러: 15, 재고: 10 },
    { name: '건대점 (T)', 가격: 20, 사이즈: 40, 컬러: 25, 재고: 15 },
    { name: '홍대점 (C)', 가격: 35, 사이즈: 35, 컬러: 20, 재고: 10 },
];

const MOCK_PRODUCTS = [
    { id: 'PRD-1029', name: '캐시미어 블렌드 코트', fittings: 145, buys: 42, rate: '29.0%' },
    { id: 'PRD-8821', name: '울 혼방 셋업 재킷', fittings: 112, buys: 68, rate: '60.7%' },
    { id: 'PRD-3302', name: '슬림핏 코튼 팬츠', fittings: 89, buys: 35, rate: '39.3%' },
];

export default function HqDashboardScreen() {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHqData = async () => {
        setIsLoading(true);
        const data = await apiClient.getHqKpiSummary();
        if (data && data.treatment) setSummary(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchHqData();
        const interval = setInterval(fetchHqData, 5 * 60 * 1000); // 5 min polling
        return () => clearInterval(interval);
    }, []);

    // Calculate dynamic values for gauges if available
    const getKpiVal = (key) => summary ? Number(summary.treatment[key] || 0) : 0;

    // Simulate calculated rates based on raw numeric aggregations
    const kpis = [
        { label: '재방문율', val: summary ? ((getKpiVal('revisitors') / getKpiVal('total_visitors')) * 100).toFixed(1) : 0, unit: '%', target: 30 },
        { label: '재구매율', val: summary ? ((getKpiVal('repurchases') / getKpiVal('total_purchases')) * 100).toFixed(1) : 0, unit: '%', target: 25 },
        { label: '매출 증가율 (MoM)', val: summary ? 12.5 : 0, unit: '%', target: 10 }, // Simulated based on baseline comparison 
        { label: '멤버십 가입 증가율', val: summary ? 8.2 : 0, unit: '%', target: 5 },
        { label: '단골 객단가 증가율', val: summary ? 15.0 : 0, unit: '%', target: 15 },
        { label: '미구매 데이터 수집', val: getKpiVal('non_purchase_data_count'), unit: '건', target: 1000 },
        { label: '평균 만족도', val: getKpiVal('avg_satisfaction').toFixed(1), unit: '점', target: 4.5 },
    ];

    const chartData = summary ? [
        { name: '방문객', Treatment: getKpiVal('total_visitors'), Control: Number(summary.control.total_visitors || 0) },
        { name: '구매건', Treatment: getKpiVal('total_purchases'), Control: Number(summary.control.total_purchases || 0) },
        { name: '멤버십가입', Treatment: getKpiVal('new_memberships'), Control: Number(summary.control.new_memberships || 0) },
        { name: '미구매수집', Treatment: getKpiVal('non_purchase_data_count'), Control: Number(summary.control.non_purchase_data_count || 0) },
    ] : [];

    return (
        <div className="flex justify-center min-h-[calc(100vh-64px)] p-6 bg-surface">
            <div className="w-full max-w-[1440px] flex flex-col gap-6">

                {/* Header info */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
                            Retail Sync HQ Control Center
                        </h1>
                        <p className="text-textSecondary text-sm mt-1">전사 매장 7대 핵심 KPI 및 DID 실험군 대조군 비교 분석</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select className="bg-white border border-borderGray rounded-lg px-4 py-2 text-sm font-medium outline-none">
                            <option>최근 1주</option>
                            <option>최근 2주</option>
                            <option>최근 4주</option>
                            <option>전체 기간</option>
                        </select>
                        <button onClick={fetchHqData} className="flex items-center gap-2 bg-white border border-borderGray px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 tap-active">
                            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> 갱신
                        </button>
                    </div>
                </div>

                {/* 7 KPI Gauges Container */}
                <div className="grid grid-cols-7 gap-4">
                    {kpis.map((kpi, idx) => {
                        const isAchieved = Number(kpi.val) >= kpi.target;
                        return (
                            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-borderGray flex flex-col items-center justify-center text-center relative overflow-hidden">
                                {isAchieved && <div className="absolute top-0 left-0 w-full h-1 bg-accentGreen" />}
                                <div className="text-[13px] font-bold text-textSecondary mb-2 h-8 flex items-center">{kpi.label}</div>
                                <div className="text-2xl font-extrabold text-textPrimary flex items-baseline gap-1">
                                    {kpi.val} <span className="text-sm font-semibold text-gray-400">{kpi.unit}</span>
                                </div>
                                <div className="text-[11px] text-gray-400 mt-2 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
                                    목표 {kpi.target}{kpi.unit}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Main Visualizations */}
                <div className="grid grid-cols-3 gap-6 h-[400px]">
                    {/* Treatment vs Control Bar Chart */}
                    <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-[16px] text-textPrimary">Treatment vs Control 비교 성과 (절대값)</h3>
                            <div className="flex items-center gap-2 text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full">
                                <TrendingUp size={14} /> T 집단 성과 우수
                            </div>
                        </div>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} wrapperClassName="rounded-lg shadow-lg" />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Treatment" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                    <Bar dataKey="Control" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col overflow-hidden">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">상품별 피팅-구매 전환율 (Top 3)</h3>
                        <div className="flex-1 overflow-auto">
                            <div className="space-y-3">
                                {MOCK_PRODUCTS.map((p, i) => (
                                    <div key={i} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-[14px] text-textPrimary">{p.name}</span>
                                            <span className="text-[11px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">{p.id}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="text-xs text-textSecondary font-medium">
                                                피팅 <span className="text-textPrimary font-bold">{p.fittings}</span> · 구매 <span className="text-textPrimary font-bold">{p.buys}</span>
                                            </div>
                                            <div className="text-[15px] font-extrabold text-primary">{p.rate}</div>
                                        </div>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div className="bg-primary h-full" style={{ width: p.rate }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Heatmaps */}
                <div className="grid grid-cols-2 gap-6 h-[250px]">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">미구매 사유 매장별 분포 (Mock Heatmap)</h3>
                        <div className="flex-1 overflow-auto w-full">
                            <table className="w-full text-center text-[12px]">
                                <thead>
                                    <tr className="text-gray-400 font-semibold mb-2">
                                        <th className="text-left pb-2">매장</th>
                                        <th className="pb-2">가격/할인</th>
                                        <th className="pb-2">사이즈/핏</th>
                                        <th className="pb-2">컬러/소재</th>
                                        <th className="pb-2">재고부족</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_HEATMAP.map((row) => (
                                        <tr key={row.name}>
                                            <td className="text-left font-bold text-textPrimary py-2">{row.name}</td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-500 rounded py-1.5 text-white font-bold">{row.가격}</div></td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-300 rounded py-1.5 text-white font-bold">{row.사이즈}</div></td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-200 rounded py-1.5 text-blue-800 font-bold">{row.컬러}</div></td>
                                            <td className="py-2 px-1"><div className="w-full bg-blue-100 rounded py-1.5 text-blue-800 font-bold">{row.재고}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col items-center justify-center text-gray-400">
                        <span className="font-bold">시간대별 접객 밀도 시각화 영역</span>
                        <span className="text-sm mt-1">Phase 1 Data Scope Exceeded</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

```

### 📄 frontend/src/screens/InputScreen.jsx
```javascript
import React, { useState, useCallback } from 'react';
import { Zap, Users, MessageCircle, BarChart3 } from 'lucide-react';
import Screen1Customer from './Screen1Customer';
import Screen2Fitting from './Screen2Fitting';
import Screen3Context from './Screen3Context';
import Screen4Voc from './Screen4Voc';
import SuccessOverlay from '../components/SuccessOverlay';
import { apiClient } from '../services/apiClient';

const TABS = [
    { id: 'record', label: '접객 기록', icon: Zap },
    { id: 'customers', label: '고객 목록', icon: Users },
    { id: 'messages', label: '후속 관리', icon: MessageCircle },
    { id: 'dashboard', label: '대시보드', icon: BarChart3 },
];

export default function InputScreen() {
    const [activeTab, setActiveTab] = useState('record');
    const [step, setStep] = useState(1);
    const [sessionData, setSessionData] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [sessionIdDisplay, setSessionIdDisplay] = useState(null);

    const updateSession = useCallback((data) => {
        setSessionData(prev => ({ ...prev, ...data }));
    }, []);

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleComplete = async () => {
        console.log('📦 Final payload ready for backend processing:', sessionData);

        try {
            const result = await apiClient.submitSession(sessionData);
            if (result && result.session_id) {
                setSessionIdDisplay(result.session_id.slice(-4));
            }

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setStep(1);
                setSessionData({});
                setSessionIdDisplay(null);
            }, 2500);
        } catch (e) {
            console.error('Failed to submit session', e);
            alert('오프라인 저장소에 임시 저장되었습니다.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#CBD5E1]">
            <div className="relative w-full max-w-[768px] h-[1024px] bg-white flex flex-col overflow-hidden shadow-2xl md:rounded-2xl">
                {/* Header */}
                <header className="h-14 bg-primary flex items-center justify-between px-5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Zap size={18} className="text-white" />
                        </div>
                        <span className="text-white font-bold text-[17px] tracking-tight">Retail Sync Input</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {sessionIdDisplay && (
                            <span className="text-accentGreen font-bold bg-white/10 px-2 py-0.5 rounded text-[13px]">
                                세션ID: {sessionIdDisplay}
                            </span>
                        )}
                        <span className="text-white/70 text-[13px]">롯데 건대점</span>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-[13px] font-bold">JS</div>
                    </div>
                </header>

                {/* Step indicator */}
                {activeTab === 'record' && (
                    <div className="h-12 bg-white border-b border-borderGray flex items-center px-5 shrink-0">
                        <div className="flex items-center gap-1 flex-1">
                            {['고객 식별', '상품·결과', '취향·메모', 'VoC'].map((label, i) => (
                                <div key={i} className="flex items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${step > i + 1 ? 'bg-accentGreen text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        {step > i + 1 ? '✓' : i + 1}
                                    </div>
                                    <span className={`ml-1.5 text-[12px] font-semibold ${step === i + 1 ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
                                    {i < 3 && <div className={`w-8 h-[2px] mx-2 ${step > i + 1 ? 'bg-accentGreen' : 'bg-gray-200'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 overflow-y-auto bg-surface relative">
                    {activeTab === 'record' && step === 1 && <Screen1Customer data={sessionData} update={updateSession} onNext={nextStep} />}
                    {activeTab === 'record' && step === 2 && <Screen2Fitting data={sessionData} update={updateSession} onNext={nextStep} onBack={prevStep} />}
                    {activeTab === 'record' && step === 3 && <Screen3Context data={sessionData} update={updateSession} onNext={nextStep} onBack={prevStep} />}
                    {activeTab === 'record' && step === 4 && <Screen4Voc data={sessionData} update={updateSession} onComplete={handleComplete} onBack={prevStep} />}

                    {activeTab !== 'record' && (
                        <div className="flex flex-col items-center justify-center h-full text-textSecondary font-semibold gap-2">
                            <span>이 메뉴는 /store 또는 /hq 랜딩 페이지를 참고하세요.</span>
                            <span className="text-[13px] text-gray-400">태블릿 입력기에서는 접객 기록만 지원됩니다.</span>
                        </div>
                    )}
                </main>

                {/* Bottom navigation */}
                <nav className="h-[72px] bg-white border-t border-borderGray flex shrink-0">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); if (tab.id === 'record') setStep(1); }}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors tap-active ${active ? 'text-primary' : 'text-gray-400'}`}
                            >
                                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                                <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {showSuccess && <SuccessOverlay />}
            </div>
        </div>
    );
}

```

### 📄 frontend/src/screens/MemoScreen.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, MessageSquare, Tag, Star } from 'lucide-react';
import { apiClient } from '../services/apiClient';

const EXP_TAGS = [
    { id: 'STAFF_KIND', label: '친절한 서비스' },
    { id: 'PROD_REC', label: '좋은 추천' },
    { id: 'WAIT_LONG', label: '대기 시간 길었음' },
    { id: 'SIZE_STK', label: '사이즈 문제' },
    { id: 'PRICE_CONCERN', label: '가격 고민' },
    { id: 'FIT_GOOD', label: '쾌적한 피팅' },
    { id: 'MORE_OPTIONS', label: '더 다양한 옵션 원함' },
];

export default function MemoScreen() {
    const [latestSession, setLatestSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [memoText, setMemoText] = useState('');
    const [customerComment, setCustomerComment] = useState('');
    const [experienceTags, setExperienceTags] = useState([]);
    const [vocScore, setVocScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const fetchLatestSession = async () => {
        setIsLoading(true);
        const staffId = localStorage.getItem('staff_id') || 'staff-uuid-placeholder';
        const session = await apiClient.getLatestSession(staffId);

        if (session && (!latestSession || session.session_id !== latestSession.session_id)) {
            setLatestSession(session);
            // Reset forms for new session
            setMemoText('');
            setCustomerComment('');
            setExperienceTags([]);
            setVocScore(0);

            // If the latest session already has VoC submitted from Tablet, we could ideally prepopulate score.
            // Since we don't have a direct deep fetch of VoC in the current API schema response, we leave it reset.
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLatestSession();
        const interval = setInterval(fetchLatestSession, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleTag = (tagId) => {
        setExperienceTags(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    };

    const handleSave = async () => {
        if (!latestSession) return;
        setIsSaving(true);
        try {
            // 1. 접객 메모 저장 (interaction_memos)
            if (memoText.trim()) {
                await apiClient.submitMemo(latestSession.session_id, {
                    customer_id: latestSession.customer?.customer_id,
                    input_type: 'TEXT',
                    raw_text: memoText,
                });
            }

            // 2. VoC 저장 (customer_voc) — 코멘트 또는 경험태그가 있을 때만
            if (customerComment.trim() || experienceTags.length > 0 || vocScore > 0) {
                // Determine staff ID (from local storage login simulation)
                const staffId = localStorage.getItem('staff_id') || 'staff-uuid-placeholder';
                await apiClient.submitVoc(latestSession.session_id, {
                    customer_id: latestSession.customer?.customer_id,
                    staff_id: staffId,
                    satisfaction_score: vocScore > 0 ? vocScore : 5, // Fallback default if forgot to set
                    experience_tags: experienceTags,
                    customer_comment: customerComment,
                    voc_source: 'STAFF_OBS',
                });
            }

            alert('메모 및 VoC 저장 완료');
            setMemoText('');
            setCustomerComment('');
            setExperienceTags([]);
            setVocScore(0);
        } catch (e) {
            alert('저장 실패. 네트워크를 확인해주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex justify-center min-h-[calc(100vh-64px)] p-6 bg-surface">
            <div className="w-full max-w-[1024px] flex flex-col gap-6">

                {/* Header & Session Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex gap-6 items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-bold text-textPrimary">현재 활성 세션</h2>
                            {isLoading ? (
                                <RefreshCw size={16} className="text-gray-400 animate-spin" />
                            ) : (
                                <span className="text-[12px] text-gray-400">자동 갱신됨 (5초)</span>
                            )}
                        </div>

                        {latestSession ? (
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-[13px] text-textSecondary block mb-1">고객 정보</span>
                                    <div className="font-semibold text-textPrimary">
                                        {latestSession.customer?.gender === 'M' ? '남성' : '여성'} / {latestSession.customer?.age_group}대
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[13px] text-textSecondary block mb-1">방문 목적</span>
                                    <div className="font-semibold text-textPrimary">
                                        {latestSession.visit_purpose || '미지정'}
                                    </div>
                                </div>
                                <div className="flex-1 text-right">
                                    <span className="text-[12px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                                        ID: {latestSession.session_id.slice(-4).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 py-2">대기 중인 세션이 없습니다. 태블릿에서 새 접객을 시작해주세요.</p>
                        )}
                    </div>
                </div>

                {/* Main Typing Zone */}
                <div className="flex flex-col gap-6 flex-1">
                    {/* Upper: Free Text Memo (interaction_memos) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="text-[16px] font-bold text-textPrimary flex items-center gap-2 mb-4">
                            <MessageSquare size={18} /> 상세 접객 메모
                        </h3>
                        <textarea
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                            disabled={!latestSession}
                            placeholder="고객 대화 맥락, 망설임 이유, 동행자 반응 등을 자유롭게 기록하세요..."
                            className="w-full min-h-[200px] p-4 bg-surface border border-borderGray rounded-xl text-[15px] leading-relaxed resize-none focus:outline-none focus:border-primary placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Lower: VoC Options (customer_voc) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-textPrimary flex items-center gap-2">
                                <Tag size={18} /> 고객 VoC 기록
                            </h3>

                            {/* VoC Score (Star Rating) */}
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-medium text-textSecondary">만족도</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setVocScore(s)}
                                            disabled={!latestSession}
                                            className={`p-1 transition-colors ${vocScore >= s ? 'text-yellow-400' : 'text-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <Star size={24} fill={vocScore >= s ? 'currentColor' : 'none'} strokeWidth={vocScore >= s ? 0 : 2} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[14px] font-bold text-textPrimary mb-3">경험 태그</h4>
                            <div className="flex flex-wrap gap-2">
                                {EXP_TAGS.map(tag => {
                                    const isSelected = experienceTags.includes(tag.id);
                                    return (
                                        <button
                                            key={tag.id}
                                            disabled={!latestSession}
                                            onClick={() => toggleTag(tag.id)}
                                            className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors tap-active border disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-surface text-textPrimary border-borderGray hover:bg-gray-100'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <h4 className="text-[14px] font-bold text-textPrimary mb-3">고객 직접 코멘트</h4>
                            <textarea
                                value={customerComment}
                                onChange={(e) => setCustomerComment(e.target.value)}
                                disabled={!latestSession}
                                placeholder="고객이 남긴 칭찬/불만 코멘트 (예: 직원분 추천이 좋았어요)"
                                className="w-full min-h-[100px] p-4 bg-surface border border-borderGray rounded-xl text-[14px] leading-relaxed resize-none focus:outline-none focus:border-primary placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <button
                            disabled={!latestSession || isSaving}
                            onClick={handleSave}
                            className={`w-full h-14 mt-4 rounded-xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isSaving ? 'bg-gray-300 text-gray-500' : 'bg-primary text-white hover:bg-primary/90'
                                }`}
                        >
                            {isSaving ? '저장 중...' : <><Save size={20} /> 접객 통계 및 메모 등록</>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

```

### 📄 frontend/src/screens/Screen1Customer.jsx
```javascript
import React, { useState } from 'react';
import { User, Users2, Search, ChevronRight } from 'lucide-react';

const GENDERS = ['남성', '여성'];
const AGES = ['20대', '30대', '40대', '50대', '60대+'];
const COMPANIONS = ['혼자', '커플', '친구', '가족'];
const PURPOSES = ['구경', '특정 상품', '선물', '행사'];
const CUSTOMER_TYPES = [
    { id: 'MEMBER', label: '멤버십 고객', icon: '💎', desc: '회원번호 또는 전화번호로 검색' },
    { id: 'NON_MEMBER_BUY', label: '비멤버십 구매 고객', icon: '🛍️', desc: '구매 이력이 있는 고객' },
    { id: 'NON_MEMBER_VISIT', label: '미구매 방문 고객', icon: '👤', desc: '상품만 둘러본 고객' },
];

export default function Screen1Customer({ data, update, onNext }) {
    const [custType, setCustType] = useState(data.customer_type || '');
    const [phoneLast4, setPhoneLast4] = useState(data.phone_last4 || '');
    const [gender, setGender] = useState(data.gender || '');
    const [ageGroup, setAgeGroup] = useState(data.age_group || '');
    const [companion, setCompanion] = useState(data.companion_type || '');
    const [purpose, setPurpose] = useState(data.visit_purpose || '');

    const canProceed = custType && gender && ageGroup;

    const handleNext = () => {
        update({
            customer_type: custType,
            phone_last4: phoneLast4,
            gender: gender === '남성' ? 'M' : 'F',
            age_group: ageGroup.replace('대', 's').replace('+', '+'),
            companion_type: companion || 'ALONE',
            visit_purpose: purpose || 'BROWSE',
            visit_type: custType === 'MEMBER' ? 'REVISIT' : 'NEW',
        });
        onNext();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Customer Type */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">고객 유형</h3>
                    <div className="space-y-2.5">
                        {CUSTOMER_TYPES.map(ct => (
                            <button
                                key={ct.id}
                                onClick={() => setCustType(ct.id)}
                                className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all tap-active ${custType === ct.id ? 'border-primary bg-blue-50 shadow-sm' : 'border-borderGray bg-white'
                                    }`}
                            >
                                <span className="text-2xl mr-3">{ct.icon}</span>
                                <div className="text-left flex-1">
                                    <p className={`font-bold text-[15px] ${custType === ct.id ? 'text-primary' : 'text-textPrimary'}`}>{ct.label}</p>
                                    <p className="text-[12px] text-textSecondary mt-0.5">{ct.desc}</p>
                                </div>
                                {custType === ct.id && <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><span className="text-white text-[12px]">✓</span></div>}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Phone (for members) */}
                {custType === 'MEMBER' && (
                    <section>
                        <h3 className="text-[15px] font-bold text-textPrimary mb-3">전화번호 뒷 4자리</h3>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                maxLength={4}
                                value={phoneLast4}
                                onChange={e => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                                placeholder="0000"
                                className="flex-1 h-14 bg-white border-2 border-borderGray rounded-xl text-center text-2xl font-bold tracking-[0.3em] focus:outline-none focus:border-primary"
                            />
                            <button className="h-14 px-5 bg-primary rounded-xl text-white font-bold flex items-center gap-1 tap-active">
                                <Search size={18} /> 검색
                            </button>
                        </div>
                    </section>
                )}

                {/* Gender */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">성별</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {GENDERS.map(g => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={`h-14 rounded-xl font-bold text-[16px] transition-all tap-active ${gender === g ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Age */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">연령대</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {AGES.map(a => (
                            <button
                                key={a}
                                onClick={() => setAgeGroup(a)}
                                className={`h-12 rounded-xl font-bold text-[14px] transition-all tap-active ${ageGroup === a ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Companion */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">동행 유형 <span className="text-textSecondary font-normal">(선택)</span></h3>
                    <div className="grid grid-cols-4 gap-2">
                        {COMPANIONS.map(c => (
                            <button
                                key={c}
                                onClick={() => setCompanion(prev => prev === c ? '' : c)}
                                className={`h-12 rounded-xl font-bold text-[14px] transition-all tap-active ${companion === c ? 'bg-primary text-white' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Purpose */}
                <section>
                    <h3 className="text-[15px] font-bold text-textPrimary mb-3">방문 목적 <span className="text-textSecondary font-normal">(선택)</span></h3>
                    <div className="grid grid-cols-4 gap-2">
                        {PURPOSES.map(p => (
                            <button
                                key={p}
                                onClick={() => setPurpose(prev => prev === p ? '' : p)}
                                className={`h-12 rounded-xl font-bold text-[14px] transition-all tap-active ${purpose === p ? 'bg-primary text-white' : 'bg-white border-2 border-borderGray text-textPrimary'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {/* Bottom action */}
            <div className="p-5 bg-white border-t border-borderGray shrink-0">
                <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`w-full h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    다음: 상품·결과 기록 <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

```

### 📄 frontend/src/screens/Screen2Fitting.jsx
```javascript
import React, { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Check,
} from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "FREE"];
const REASON_CATEGORIES = [
  {
    id: "PRICE",
    label: "가격",
    subTags: ["예산 초과", "가성비 아쉬움", "할인율 낮음"],
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    id: "SIZE_FIT",
    label: "사이즈/핏",
    subTags: ["품이 큼", "품이 작음", "기장 김", "기장 짧음", "어깨 안 맞음"],
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    id: "COLOR",
    label: "컬러",
    subTags: ["원톤 안맞음", "채도 아쉬움", "색상 너무 튐"],
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "STYLE_MISMATCH",
    label: "스타일/디자인",
    subTags: ["디테일 부담", "평소 스타일 아님", "유행 지남", "원단/소재 아쉬움"],
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "TIMING",
    label: "시즌/타이밍",
    subTags: ["지금 입기 애매함", "날씨 안맞음", "다음 시즌 대기"],
    color: "bg-teal-100 text-teal-700 border-teal-200",
  },
  {
    id: "COMPARISON",
    label: "타 브랜/상품 비교",
    subTags: ["다른 매장 둘러보기", "온라인이랑 비교", "다른 상품 구매 결정"],
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    id: "COMPANION",
    label: "동행인 의견",
    subTags: ["동행인이 반대함", "조언/추천 못받음"],
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
  {
    id: "STOCK_OUT",
    label: "재고 품절",
    subTags: ["원하는 사이즈/컬러 없음", "예약 배송 거부"],
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

const ACTIONS = [
  { id: "STOCK_ALARM", label: "입고 알림" },
  { id: "COORD_SUGGEST", label: "코디 제안" },
  { id: "PROMO_MSG", label: "프로모션 안내" },
];

export default function Screen2Fitting({ data, update, onNext, onBack }) {
  const [productCode, setProductCode] = useState(data.product_code || "");
  const [size, setSize] = useState(data.fitting_size || "");
  const [didTryOn, setDidTryOn] = useState(data.did_try_on ?? true);
  const [purchaseResult, setPurchaseResult] = useState(
    data.purchase_result || "",
  );
  const [selectedReasons, setSelectedReasons] = useState(data.reasons || []);
  const [selectedSubTags, setSelectedSubTags] = useState(
    data.sub_reasons || {},
  );
  const [followUp, setFollowUp] = useState(data.follow_up || "");
  const [showWarning, setShowWarning] = useState(false);
  const [showMembershipPopup, setShowMembershipPopup] = useState(false);

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const toggleSubTag = (categoryId, subTag) => {
    setSelectedSubTags((prev) => {
      const current = prev[categoryId] || [];
      const updated = current.includes(subTag)
        ? current.filter((t) => t !== subTag)
        : [...current, subTag];
      return { ...prev, [categoryId]: updated };
    });
  };

  const handleNext = () => {
    if (purchaseResult === "PURCHASED" && !productCode) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    if (purchaseResult === "NOT_PURCHASED" && selectedReasons.length === 0) {
      alert("미구매 사유를 최소 1개 이상 선택해주세요.");
      return;
    }

    // 멤버십 가입 유도 팝업 (비멤버 구매 시)
    const isMembershipMember = data.membership_status === "MEMBER";
    if (purchaseResult === "PURCHASED" && !isMembershipMember && !data.membership_joined_at) {
      setShowMembershipPopup(true);
      return;
    }

    proceedToNext();
  };

  const proceedToNext = (joinedMembership = false) => {
    if (joinedMembership) {
      update({ membership_status: "MEMBER", membership_joined_at: new Date().toISOString() });
    }
    update({
      product_code: productCode,
      fitting_size: size,
      did_try_on: didTryOn,
      purchase_result: purchaseResult,
      reasons: selectedReasons,
      sub_reasons: selectedSubTags,
      follow_up: followUp,
    });
    onNext();
  };

  const isPurchased = purchaseResult === "PURCHASED";
  const isNotPurchased = purchaseResult === "NOT_PURCHASED";
  const canProceed =
    purchaseResult &&
    (isPurchased || (isNotPurchased && selectedReasons.length > 0));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Product Selection */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-textPrimary">
              상품 정보
            </h3>
            <button className="flex items-center gap-1 text-[13px] font-semibold text-primary bg-blue-50 px-3 py-1.5 rounded-lg tap-active">
              <Camera size={16} /> 바코드 스캔
            </button>
          </div>
          <div className="relative mb-3">
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="상품 코드 입력 (선택)"
              className={`w - full h - 14 px - 4 bg - white border - 2 rounded - xl text - [15px] focus: outline - none ${showWarning
                  ? "border-accentRed bg-red-50"
                  : "border-borderGray focus:border-primary"
                } `}
            />
            {showWarning && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-accentRed text-[12px] font-bold">
                코드 필수입력!
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-textSecondary">
              피팅 사이즈{" "}
              <span className="text-gray-400 font-normal">(선택)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-textSecondary">
                피팅룸 이용
              </span>
              <button
                onClick={() => setDidTryOn(!didTryOn)}
                className={`w - 12 h - 6 rounded - full p - 1 transition - colors ${didTryOn ? "bg-primary" : "bg-gray-300"} `}
              >
                <div
                  className={`w - 4 h - 4 rounded - full bg - white transition - transform ${didTryOn ? "translate-x-6" : "translate-x-0"} `}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`h - 11 rounded - lg font - bold text - [13px] transition - all tap - active ${size === s
                    ? "bg-textPrimary text-white shadow-md"
                    : "bg-white border-2 border-borderGray text-textSecondary"
                  } `}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Purchase Result */}
        <section>
          <h3 className="text-[15px] font-bold text-textPrimary mb-3">
            구매 여부 <span className="text-accentRed">*</span>
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPurchaseResult("PURCHASED");
                setSelectedReasons([]);
              }}
              className={`flex - 1 h - 14 rounded - xl flex items - center justify - center gap - 2 font - bold text - [16px] transition - all tap - active border - 2 ${isPurchased
                  ? "bg-accentGreen border-accentGreen text-white shadow-lg shadow-green-500/30"
                  : "bg-white border-borderGray text-textPrimary"
                } `}
            >
              <span className="text-xl">O</span> 구매함
            </button>
            <button
              onClick={() => setPurchaseResult("NOT_PURCHASED")}
              className={`flex - 1 h - 14 rounded - xl flex items - center justify - center gap - 2 font - bold text - [16px] transition - all tap - active border - 2 ${isNotPurchased
                  ? "bg-accentRed border-accentRed text-white shadow-lg shadow-red-500/30"
                  : "bg-white border-borderGray text-textPrimary"
                } `}
            >
              <span className="text-xl">X</span> 미구매
            </button>
          </div>
        </section>

        {/* Non-Purchase Reasons */}
        {isNotPurchased && (
          <section className="animate-slide-up bg-white p-4 rounded-xl border border-borderGray shadow-sm">
            <h3 className="text-[15px] font-bold text-textPrimary mb-3 flex items-center gap-2">
              미구매 사유 <span className="text-accentRed">*</span>
              <span className="text-[12px] font-normal text-textSecondary bg-gray-100 px-2 py-0.5 rounded-md">
                복수 선택 가능
              </span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {REASON_CATEGORIES.map((rc) => {
                const isSelected = selectedReasons.includes(rc.id);
                return (
                  <button
                    key={rc.id}
                    onClick={() => toggleReason(rc.id)}
                    className={`px - 4 py - 2.5 rounded - full font - bold text - [14px] transition - all tap - active border - 2 flex items - center gap - 1.5 ${isSelected
                        ? `${rc.color} shadow-sm border-transparent`
                        : "bg-white border-borderGray text-textSecondary"
                      } `}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                    {rc.label}
                  </button>
                );
              })}
            </div>

            {/* Sub-tags for selected reasons */}
            {selectedReasons.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-3 animate-slide-up space-y-4">
                <h4 className="text-[13px] font-bold text-gray-500 mb-2">
                  상세 사유 선택 <span className="font-normal">(선택)</span>
                </h4>
                {selectedReasons.map((reasonId) => {
                  const category = REASON_CATEGORIES.find(
                    (rc) => rc.id === reasonId,
                  );
                  if (!category || !category.subTags) return null;

                  return (
                    <div key={category.id}>
                      <span
                        className={`text - [12px] font - bold ${category.color.split(" ")[1]} mb - 1.5 block`}
                      >
                        {category.label}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {category.subTags.map((sub) => {
                          const isSelected = (
                            selectedSubTags[category.id] || []
                          ).includes(sub);
                          return (
                            <button
                              key={sub}
                              onClick={() => toggleSubTag(category.id, sub)}
                              className={`px - 2.5 py - 1.5 rounded - md text - [13px] transition - colors border ${isSelected
                                  ? "bg-textPrimary text-white border-transparent shadow-sm"
                                  : "bg-white text-textSecondary border-gray-300"
                                } `}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Follow-up Action */}
        {isNotPurchased && selectedReasons.length > 0 && (
          <section className="animate-slide-up">
            <h3 className="text-[15px] font-bold text-textPrimary mb-3">
              후속 관리 액션{" "}
              <span className="text-textSecondary font-normal">(선택)</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    setFollowUp((prev) => (prev === a.id ? "" : a.id))
                  }
                  className={`h - 12 flex items - center justify - center gap - 1.5 rounded - lg border - 2 font - semibold text - [13px] transition - all tap - active ${followUp === a.id
                      ? "bg-blue-50 border-primary text-primary"
                      : "bg-white border-borderGray text-textSecondary"
                    } `}
                >
                  {followUp === a.id && <MessageSquare size={14} />}
                  {a.label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex p-5 gap-3 bg-white border-t border-borderGray shrink-0">
        <button
          onClick={onBack}
          className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 text-textSecondary tap-active"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex-1 h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed
              ? "bg-primary text-white shadow-lg shadow-blue-500/30"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          다음: 취향·메모 <ChevronRight size={20} />
        </button>
      </div>

      {/* Membership Popup */}
      {showMembershipPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-80 overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                🌟
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">멤버십 혜택 안내</h3>
              <p className="text-gray-500 text-[14px] leading-relaxed mb-6">
                현재 구매하신 상품에 대해<br />즉시 5% 적립 혜택을 받으실 수 있습니다.<br />멤버십에 가입하시겠습니까?
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowMembershipPopup(false);
                    proceedToNext(true);
                  }}
                  className="w-full h-12 bg-primary text-white font-bold rounded-xl tap-active shadow-lg shadow-blue-500/30"
                >
                  가입하고 포인트 적립
                </button>
                <button
                  onClick={() => {
                    setShowMembershipPopup(false);
                    proceedToNext(false);
                  }}
                  className="w-full h-12 bg-gray-100 text-gray-500 font-semibold rounded-xl tap-active"
                >
                  아니요, 괜찮습니다
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

### 📄 frontend/src/screens/Screen3Context.jsx
```javascript
import React, { useState, useRef } from 'react';
import { Mic, ChevronLeft, ChevronRight, Tags } from 'lucide-react';

const PREF_CATEGORIES = [
    { id: 'FIT', label: '핏', tags: ['오버핏', '슬림핏', '스탠다드', '와이드'] },
    { id: 'TONE', label: '톤', tags: ['쿨톤', '웜톤', '파스텔', '모노톤', '비비드'] },
    { id: 'STYLE', label: '스타일', tags: ['캐주얼', '포멀', '스트릿', '고프코어', '스포티'] },
    { id: 'TPO', label: '용도', tags: ['출근', '데이트', '운동', '여행', '하객룩'] },
];

export default function Screen3Context({ data, update, onNext, onBack }) {
    const [preferences, setPreferences] = useState(data.preferences || {});
    const [memo, setMemo] = useState(data.memo || '');
    const [isRecording, setIsRecording] = useState(false);
    const memoRef = useRef(null);

    const togglePrefTag = (categoryId, tag) => {
        setPreferences(prev => {
            const current = prev[categoryId] || [];
            const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
            return { ...prev, [categoryId]: updated };
        });
    };

    const hasPreferences = Object.values(preferences).some(arr => arr.length > 0);
    const canProceed = hasPreferences || memo.trim().length > 0;

    const handleNext = () => {
        update({ preferences, memo });
        onNext();
    };

    const handleMicClick = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            // Simulate STT appending text
            setTimeout(() => {
                setMemo(prev => prev + (prev ? ' ' : '') + '고객님이 슬림핏 바지는 불편하시다고 하셨고 약간 통이 넓은 스타일을 선호하심.');
                setIsRecording(false);
            }, 2000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Voice/Text Memo Placeholder */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[15px] font-bold text-textPrimary flex items-center gap-1.5">
                            <MessageSquareIcon /> 자유 메모 <span className="text-textSecondary font-normal text-[13px]"></span>
                        </h3>
                    </div>
                    <div className="w-full h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                        <span className="text-gray-400 font-medium text-[14px]">노트북에서 상세 메모를 입력하세요</span>
                    </div>
                </section>

                {/* Preference Tags */}
                <section>
                    <div className="flex items-center gap-1.5 mb-4">
                        <Tags size={18} className="text-textPrimary" />
                        <h3 className="text-[15px] font-bold text-textPrimary">고객 취향 태그 <span className="text-textSecondary font-normal text-[13px]">(선택)</span></h3>
                    </div>

                    <div className="space-y-5 bg-white p-5 rounded-2xl border border-borderGray shadow-sm">
                        {PREF_CATEGORIES.map(category => (
                            <div key={category.id}>
                                <div className="text-[13px] font-bold text-textSecondary mb-2">{category.label}</div>
                                <div className="flex flex-wrap gap-2">
                                    {category.tags.map(tag => {
                                        const isSelected = (preferences[category.id] || []).includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => togglePrefTag(category.id, tag)}
                                                className={`px-3.5 py-2 rounded-full text-[14px] font-medium transition-colors tap-active border ${isSelected ? 'bg-textPrimary text-white border-transparent' : 'bg-surface text-textPrimary border-borderGray'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Bottom actions */}
            <div className="flex p-5 gap-3 bg-white border-t border-borderGray shrink-0">
                <button
                    onClick={onBack}
                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 text-textSecondary tap-active"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={handleNext}
                    className={`flex-1 h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-white'
                        }`}
                >
                    {canProceed ? (
                        <>다음: 고객 만족도 (VoC) <ChevronRight size={20} /></>
                    ) : (
                        <>접객 메모 건너뛰기 <ChevronRight size={20} /></>
                    )}
                </button>
            </div>
        </div>
    );
}

function MessageSquareIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    );
}

```

### 📄 frontend/src/screens/Screen4Voc.jsx
```javascript
import React, { useState } from 'react';
import { Star, ChevronLeft, Save, Smile } from 'lucide-react';

const EXP_TAGS = [
    { id: 'STAFF_KIND', label: '직원이 친절함' },
    { id: 'STORE_CLEAN', label: '매장이 청결함' },
    { id: 'FIT_GOOD', label: '피팅룸 안내 좋음' },
    { id: 'PROD_REC', label: '상품 추천 유용함' },
    { id: 'WAIT_LONG', label: '응대 대기 길었음' },
    { id: 'SIZE_STK', label: '사이즈 재고 부족' },
];

export default function Screen4Voc({ data, update, onComplete, onBack }) {
    const [score, setScore] = useState(data.voc_score || 0);
    const [tags, setTags] = useState(data.voc_tags || []);
    const [comment, setComment] = useState(data.voc_comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleTag = (tagId) => {
        setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
    };

    const handleComplete = () => {
        setIsSubmitting(true);
        update({ voc_score: score, voc_tags: tags, voc_comment: comment });
        // Simulate API delay
        setTimeout(() => {
            setIsSubmitting(false);
            onComplete();
        }, 600);
    };

    const canProceed = score > 0;

    return (
        <div className="flex flex-col h-full bg-surface">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Core Satisfaction Score */}
                <section className="bg-white p-6 rounded-2xl border border-borderGray shadow-sm text-center">
                    <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <Smile size={24} className="text-primary" />
                        </div>
                    </div>
                    <h3 className="text-[17px] font-bold text-textPrimary mb-1">고객 응대 만족도 <span className="text-accentRed">*</span></h3>
                    <p className="text-[13px] text-textSecondary mb-5">오늘 이 고객은 매장 경험에 얼마나 만족하셨나요?</p>

                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(v => (
                            <button
                                key={v}
                                onClick={() => setScore(v)}
                                className={`w-12 h-12 flex flex-col items-center justify-center rounded-full transition-all tap-active ${score >= v ? 'bg-primary text-white scale-110 shadow-md transform' : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                <Star size={22} fill={score >= v ? "currentColor" : "none"} strokeWidth={score >= v ? 0 : 2} />
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between px-2 mt-2 text-[12px] font-bold text-gray-400">
                        <span>매우 불만족</span>
                        <span>매우 만족</span>
                    </div>
                </section>

                {/* Sections removed for strict tablet input routing */}

            </div>

            {/* Bottom actions */}
            <div className="flex p-5 gap-3 bg-white border-t border-borderGray shrink-0">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 text-textSecondary tap-active"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={handleComplete}
                    disabled={!canProceed || isSubmitting}
                    className={`flex-1 h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed && !isSubmitting ? 'bg-textPrimary text-white shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            저장 중...
                        </div>
                    ) : (
                        <>최종 완료 <Save size={20} /></>
                    )}
                </button>
            </div>
        </div>
    );
}

```

### 📄 frontend/src/screens/StoreDashboardScreen.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, Smile, PieChart as PieChartIcon, LayoutList, Calendar, Target } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiClient } from '../services/apiClient';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9'];

// Mock data for lists since explicit endpoints for today actions were not built yet in Phase 1
const MOCK_RECORDS = [
    { time: '14:30', cust: '여성/20대', item: '울 혼방 셋업 재킷', buy: 'O', reason: '-', voc: 5 },
    { time: '15:10', cust: '남성/30대', item: '캐시미어 블렌드 코트', buy: 'X', reason: '가격 고민', voc: 4 },
    { time: '16:05', cust: '여성/30대', item: '슬림핏 코튼 팬츠', buy: 'O', reason: '-', voc: 5 },
];

const MOCK_FOLLOW_UPS = [
    { time: '내일 14:00', target: '김지연 고객님 (4920)', action: '입고 알림 문자 발송' },
    { time: '모레 10:00', target: '박민수 고객님 (1192)', action: '사이즈 교환 해피콜' },
];

export default function StoreDashboardScreen() {
    const [stats, setStats] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [npReasons, setNpReasons] = useState([]);
    const [vocInfo, setVocInfo] = useState({ avg_score: 0 });

    const fetchDashboard = async () => {
        const storeCode = 'KR-001'; // hardcoded for POC 롯데 건대점
        const [_mgr, _week, _np, _voc] = await Promise.all([
            apiClient.getManagerDashboard(storeCode),
            apiClient.getStoreWeeklyReport(storeCode),
            apiClient.getNonPurchaseAnalysis(storeCode),
            apiClient.getVocAnalysis(storeCode)
        ]);

        if (_mgr) setStats(_mgr);
        if (_week) {
            const formatted = _week.map(d => ({
                day: new Date(d.snapshot_date).toLocaleDateString('ko-KR', { weekday: 'short' }),
                visitors: Number(d.total_visitors)
            }));
            if (formatted.length === 0) {
                // Mock chart data if DB lacks historical batch data
                setWeeklyData([
                    { day: '월', visitors: 112 }, { day: '화', visitors: 98 },
                    { day: '수', visitors: 145 }, { day: '목', visitors: 130 },
                    { day: '금', visitors: 180 }, { day: '토', visitors: 320 },
                    { day: '일', visitors: 290 }
                ]);
            } else {
                setWeeklyData(formatted);
            }
        }
        if (_np) {
            const arr = _np.map(r => ({ name: r.reason_tag, value: Number(r.count) }));
            setNpReasons(arr.length > 0 ? arr : [{ name: '데이터 없음', value: 1 }]);
        }
        if (_voc) setVocInfo(_voc);
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    const npCount = npReasons.reduce((acc, curr) => curr.name !== '데이터 없음' ? acc + curr.value : acc, 0);

    return (
        <div className="flex justify-center min-h-[calc(100vh-64px)] p-6 bg-surface">
            <div className="w-full max-w-[1280px] flex flex-col gap-6">

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">오늘 접객 건수</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {stats ? stats.total_visitors : '-'} <span className="text-sm font-medium text-gray-400">건</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><ShoppingBag size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">피팅→구매 전환율</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {stats && stats.fitting_conversion_funnel.fittings > 0
                                ? ((stats.fitting_conversion_funnel.purchases / stats.fitting_conversion_funnel.fittings) * 100).toFixed(1)
                                : '0.0'} <span className="text-sm font-medium text-gray-400">%</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Smile size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">평균 만족도</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {vocInfo.avg_score > 0 ? Number(vocInfo.avg_score).toFixed(1) : '-'} <span className="text-sm font-medium text-gray-400">/ 5.0</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-borderGray flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><PieChartIcon size={18} /></div>
                            <span className="font-bold text-textPrimary text-[15px]">미구매 데이터 수집</span>
                        </div>
                        <div className="text-3xl font-extrabold text-textPrimary">
                            {npCount} <span className="text-sm font-medium text-gray-400">건</span>
                        </div>
                    </div>
                </div>

                {/* Central Charts */}
                <div className="grid grid-cols-2 gap-6 h-[340px]">
                    {/* Donut Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">미구매 사유 분포</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={npReasons}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={90}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {npReasons.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip wrapperClassName="rounded-lg shadow-lg" />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4">최근 7일 접객 건수 추이</h3>
                        <div className="flex-1 -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom Lists */}
                <div className="grid grid-cols-2 gap-6 flex-1">
                    {/* Today Records */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4 flex items-center gap-2">
                            <LayoutList size={18} /> 오늘 접객 기록 (최근)
                        </h3>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-[14px]">
                                <thead className="text-gray-500 bg-gray-50 uppercase text-[12px]">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg font-semibold">시간</th>
                                        <th className="px-4 py-3 font-semibold">고객 유형</th>
                                        <th className="px-4 py-3 font-semibold">상품/구매</th>
                                        <th className="px-4 py-3 font-semibold">미구매 사유</th>
                                        <th className="px-4 py-3 rounded-tr-lg rounded-br-lg font-semibold">만족도</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_RECORDS.map((rec, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3.5 text-gray-500 font-medium">{rec.time}</td>
                                            <td className="px-4 py-3.5 font-medium">{rec.cust}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium truncate max-w-[120px]">{rec.item}</div>
                                                <div className={`text-[12px] font-bold ${rec.buy === 'O' ? 'text-accentGreen' : 'text-gray-400'}`}>
                                                    {rec.buy === 'O' ? '구매 확정' : '구매 안 함'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-accentRed font-medium text-[13px]">{rec.reason}</td>
                                            <td className="px-4 py-3.5 font-bold text-primary">{rec.voc} 점</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Follow ups */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-borderGray flex flex-col">
                        <h3 className="font-bold text-[16px] text-textPrimary mb-4 flex items-center gap-2">
                            <Target size={18} /> 후속 액션 예정 리스트
                        </h3>
                        <div className="flex flex-col gap-3">
                            {MOCK_FOLLOW_UPS.map((f, i) => (
                                <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
                                    <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full text-primary">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex flex-col justify-center flex-1">
                                        <div className="text-[13px] font-bold text-primary mb-1">{f.time}</div>
                                        <div className="font-bold text-[15px] mb-1">{f.action}</div>
                                        <div className="text-[13px] text-gray-500">{f.target}</div>
                                    </div>
                                    <div className="flex items-center">
                                        <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-[13px] font-bold rounded-lg transition-colors">처리</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

```

### 📄 frontend/src/services/apiClient.js
```javascript
// Simple API client stub for Phase 3 Data Pipeline validation
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = {
    async submitSession(data) {
        console.log('🚀 [Data Pipeline] Submitting session data:', data);
        // Using local testing staff_id/store_code context for POC
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch(`${API_BASE}/sessions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const result = await res.json();
                return { success: true, session_id: result.session_id };
            }
            throw new Error('Server error');
        } catch (e) {
            console.warn('Fallback to mock', e);
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({ success: true, session_id: 'mock-uuid-1234' });
                }, 800);
            });
        }
    },

    async getLatestSession(staffId) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/sessions/latest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async submitMemo(sessionId, memoData) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/sessions/${sessionId}/memos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(memoData)
            });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // --- Dashboard endpoints ---
    async getManagerDashboard(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/dashboard/manager/${storeCode}/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return null; }
    },
    async getStoreWeeklyReport(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/dashboard/store/${storeCode}/weekly`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return []; }
    },
    async getNonPurchaseAnalysis(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const query = storeCode ? `?store_code=${storeCode}` : '';
            const res = await fetch(`${API_BASE}/dashboard/hq/non-purchase${query}`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return []; }
    },
    async getVocAnalysis(storeCode) {
        const token = localStorage.getItem('token');
        try {
            const query = storeCode ? `?store_code=${storeCode}` : '';
            const res = await fetch(`${API_BASE}/dashboard/hq/voc-analysis${query}`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return null; }
    },
    async getHqKpiSummary() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/dashboard/hq/kpi-summary`, { headers: { 'Authorization': `Bearer ${token}` } });
            return await res.json();
        } catch (e) { return null; }
    }
};

```

### 📄 frontend/package.json
```json
{
    "name": "retail-sync-frontend",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "lucide-react": "^0.400.0",
        "react": "^18.3.0",
        "react-dom": "^18.3.0",
        "react-router-dom": "^7.13.1",
        "recharts": "^3.8.0",
        "zustand": "^4.5.0"
    },
    "devDependencies": {
        "@types/react": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.0",
        "autoprefixer": "^10.4.0",
        "postcss": "^8.4.0",
        "tailwindcss": "^3.4.0",
        "vite": "^5.4.0"
    }
}

```

### 📄 frontend/index.html
```html
<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=768, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>Retail Sync</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap"
        rel="stylesheet" />
</head>

<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>

</html>
```

### 📄 backend/seed.js
```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.ulxqaxrvvyremzbjwhdh:dlwjddus7091@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

const STORE_CODE = 'HYUNDAI_SHINCHON_LACOSTE';
const STAFF_IDS = [
    'staff-1111-1111-1111-111111111111',
    'staff-2222-2222-2222-222222222222',
    'staff-3333-3333-3333-333333333333'
];

const GENDERS = ['F', 'F', 'F', 'M'];
const AGE_GROUPS = ['20', '30', '30', '40', '50'];
const MEMBERSHIPS = ['MEMBER', 'NON_MEMBER', 'VIP'];
const REASON_TAGS = ['SIZE', 'PRICE', 'DESIGN', 'MATERIAL', 'MIND'];
const CATEGORIES = ['OUTER', 'TOP', 'BOTTOM', 'DRESS', 'ACC'];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
    try {
        await client.connect();
        console.log('✅ Connected to the database.');

        // 0. Wipe existing data
        console.log('Wiping existing data to reset for the single Hyundai Shinchon store...');
        await client.query('TRUNCATE TABLE daily_kpi_snapshots CASCADE');
        await client.query('TRUNCATE TABLE customer_voc CASCADE');
        await client.query('TRUNCATE TABLE follow_up_actions CASCADE');
        await client.query('TRUNCATE TABLE interaction_memos CASCADE');
        await client.query('TRUNCATE TABLE customer_preferences CASCADE');
        await client.query('TRUNCATE TABLE non_purchase_reasons CASCADE');
        await client.query('TRUNCATE TABLE fitting_records CASCADE');
        await client.query('TRUNCATE TABLE visit_sessions CASCADE');
        await client.query('TRUNCATE TABLE customers CASCADE');

        // 1. Generate 500 Customers
        console.log('Generating 500 customers...');
        let customerIds = [];
        for (let i = 0; i < 500; i++) {
            const gender = randomChoice(GENDERS);
            const ageGroup = randomChoice(AGE_GROUPS);
            const membership = randomChoice(MEMBERSHIPS);
            const totalVisits = randomInt(1, 4);
            const totalPurchases = randomInt(0, totalVisits);
            const totalAmount = totalPurchases * randomInt(50000, 300000);

            const firstVisitAt = randomDate(new Date('2025-11-01'), new Date());

            const res = await client.query(`
        INSERT INTO customers (gender, age_group, membership_status, first_visit_at, total_visit_count, total_purchase_count, total_purchase_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING customer_id
      `, [gender, ageGroup, membership, firstVisitAt, totalVisits, totalPurchases, totalAmount]);

            customerIds.push(res.rows[0].customer_id);
        }
        console.log(`✅ 500 customers inserted.`);

        // 2. Generate Sessions, Fittings, Reasons, and VoC
        console.log(`Generating visit sessions for ${STORE_CODE}...`);

        let totalSessions = 0;
        let totalFittings = 0;

        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);

        // Make about 60% of sessions "Treatment", 40% Control to simulate A/B testing inside the same store
        // Even if it's a single store, we want to see Treatment vs Control data on the dashboard.
        for (const customerId of customerIds) {
            const sessionCount = randomInt(1, 3);

            for (let s = 0; s < sessionCount; s++) {
                const staffId = randomChoice(STAFF_IDS);
                const isTreatment = Math.random() < 0.6;
                const sessionDate = randomDate(oneMonthAgo, now);
                const duration = randomInt(300, 3600); // 5 mins to 1 hour

                // Insert Visit Session
                const sessionRes = await client.query(`
          INSERT INTO visit_sessions (customer_id, store_code, staff_id, visit_type, session_start, duration_seconds, is_treatment)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING session_id
        `, [
                    customerId, STORE_CODE, staffId,
                    randomChoice(['FITTING_ONLY', 'PURCHASE', 'BROWSING']),
                    sessionDate, duration, isTreatment
                ]);

                const sessionId = sessionRes.rows[0].session_id;
                totalSessions++;

                // Add VoC randomly (30% chance)
                if (Math.random() < 0.3) {
                    await client.query(`
                INSERT INTO customer_voc (session_id, customer_id, staff_id, satisfaction_score, customer_comment)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                        sessionId, customerId, staffId,
                        randomInt(3, 5),
                        randomChoice(['매우 친절했어요.', '현대백화점은 항상 쾌적하네요.', '사이즈를 잘 찾아주셨어요.', '스타일 추천이 좋았습니다.'])
                    ]);
                }

                // Add Fitting Records
                const fittingCount = randomInt(1, 4);
                for (let f = 0; f < fittingCount; f++) {
                    const purchased = Math.random() < 0.4;
                    const purchaseResult = purchased ? 'PURCHASED' : 'NOT_PURCHASED';
                    const amount = purchased ? randomInt(5, 50) * 10000 : null;

                    const fittingRes = await client.query(`
            INSERT INTO fitting_records (session_id, customer_id, product_category, purchase_result, purchase_amount)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING fitting_id
          `, [
                        sessionId, customerId, randomChoice(CATEGORIES), purchaseResult, amount
                    ]);

                    totalFittings++;

                    // Non Purchase Reasons
                    if (!purchased) {
                        const fittingId = fittingRes.rows[0].fitting_id;
                        await client.query(`
                  INSERT INTO non_purchase_reasons (fitting_id, session_id, customer_id, reason_tag, is_primary)
                  VALUES ($1, $2, $3, $4, $5)
              `, [
                            fittingId, sessionId, customerId, randomChoice(REASON_TAGS), true
                        ]);
                    }
                }
            }
        }

        console.log(`✅ ${totalSessions} sessions generated.`);
        console.log(`✅ ${totalFittings} fitting records generated.`);

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seed();

```

