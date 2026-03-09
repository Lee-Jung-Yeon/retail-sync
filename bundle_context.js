const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const OUTPUT_FILE = path.join(ROOT_DIR, 'retail_sync_full_context.md');

// Files and directories to include
const includePaths = [
    { type: 'file', path: 'backend/database/init.sql', lang: 'sql' },
    { type: 'dir', path: 'backend/src', lang: 'typescript', ext: ['.ts'] },
    { type: 'file', path: 'backend/package.json', lang: 'json' },
    { type: 'dir', path: 'frontend/src', lang: 'javascript', ext: ['.js', '.jsx', '.css'] },
    { type: 'file', path: 'frontend/package.json', lang: 'json' },
    { type: 'file', path: 'frontend/index.html', lang: 'html' },
    { type: 'file', path: 'backend/seed.js', lang: 'javascript' }
];

let markdownContent = `# Retail Sync 프로젝트 전체 컨텍스트 (LLM 학습 및 분석용)

본 문서는 오프라인 패션 매장 환경에서 사용하는 "Retail Sync" 2차 PoC 프로젝트의 전체 아키텍처, 데이터베이스 스키마, 그리고 프론트엔드/백엔드 소스코드 전체를 하나로 통합한 문서입니다. 새로운 LLM에게 컨텍스트를 주입하거나 아키텍처를 분석할 때 사용하세요.

---

## 🏗 프로젝트 개요 및 아키텍처
- **목적**: 오프라인 매장의 접객 데이터(고객 정보, 피팅 내역, 미구매 사유, 직원 메모, VoC)를 태블릿과 노트북 환경을 구분하여 수집하고, 실시간 대시보드를 통해 A/B 테스트(Treatment vs Control) 성과를 추적하는 PoC 시스템.
- **분리된 UI/UX**:
  - \`/input\` (태블릿용): 매장 직원이 접객 중 서서 빠르게 데이터를 입력 (고객조회 -> 피팅상품 등록 -> 미구매 사유 태그 선택)
  - \`/memo\` (노트북용): 접객 완료 후 계산대 등에서 비정형 메모(텍스트)와 관찰 VoC(별점, 태그)를 분리하여 심층 기록
  - \`/store\` & \`/hq\` (PC용): 실시간 접객 현황 및 A/B 테스트 지표 대시보드 시각화
- **기술 스택**:
  - **Frontend**: React 18, Vite, React Router, TailwindCSS, Recharts, Lucide-React
  - **Backend**: NestJS 10, TypeORM, PostgreSQL (Supabase 연동)
  - **Database**: Supabase PostgreSQL (생산성 및 확장성을 위해 클라우드 전환)

---

## 🗄 데이터베이스 스키마 (초기화 SQL)
아래는 Supabase에 구축된 데이터베이스 테이블 정의서(DDL)입니다.

`;

function walkDir(dir, extensions) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file, extensions));
        } else {
            if (extensions.includes(path.extname(file))) {
                results.push(file);
            }
        }
    });
    return results;
}

function appendFileContent(filePath, lang) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    markdownContent += `### 📄 ${relativePath}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
}

includePaths.forEach(item => {
    const fullPath = path.join(ROOT_DIR, item.path);
    if (!fs.existsSync(fullPath)) return;

    if (item.type === 'file') {
        if (item.path === 'backend/database/init.sql') {
            const content = fs.readFileSync(fullPath, 'utf-8');
            markdownContent += `\`\`\`sql\n${content}\n\`\`\`\n\n---\n\n## 💻 소스 코드 전체\n\n`;
        } else {
            appendFileContent(fullPath, item.lang);
        }
    } else if (item.type === 'dir') {
        markdownContent += `\n### 📁 Directory: ${item.path}\n\n`;
        const files = walkDir(fullPath, item.ext);
        files.forEach(file => {
            appendFileContent(file, item.lang);
        });
    }
});

fs.writeFileSync(OUTPUT_FILE, markdownContent);
console.log('✅ Generated ' + OUTPUT_FILE);
