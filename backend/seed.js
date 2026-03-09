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
