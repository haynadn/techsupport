const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    seedData();
});

const generateRandomPhone = () => {
    return '08' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
};

const applicationsList = ['SIAKAD', 'Feeder PDDIKTI', 'SISTER', 'Edlink', 'SEVIMA Pay', 'GoFeeder', 'ProFeeder', 'Finance Cloud', 'HR Cloud'];

const getRandomApps = () => {
    const num = Math.floor(Math.random() * 4) + 1; // 1 to 4 apps
    const shuffled = applicationsList.sort(() => 0.5 - Math.random());
    return JSON.stringify(shuffled.slice(0, num));
};

const seedData = async () => {
    try {
        console.log('Starting seed process...');

        // --- 1. SEED AGENTS ---
        const firstNames = ['Budi', 'Siti', 'Agus', 'Dewi', 'Rudi', 'Ratna', 'Eko', 'Sri', 'Adi', 'Wati', 'Hendra', 'Rina', 'Joko', 'Nur', 'Bambang', 'Yanti', 'Dedi', 'Lestari', 'Iwan', 'Ningsih', 'Fajar', 'Putri', 'Ari', 'Indah', 'Bayu', 'Sari', 'Reza', 'Maya', 'Doni', 'Dina'];
        const lastNames = ['Santoso', 'Wulandari', 'Saputra', 'Rahayu', 'Wijaya', 'Kusuma', 'Purnomo', 'Astuti', 'Nugroho', 'Pratiwi', 'Hidayat', 'Susanti', 'Prasetyo', 'Handayani', 'Kurniawan', 'Suryani', 'Utomo', 'Mulyani', 'Firmansyah', 'Wahyuni', 'Setiawan', 'Lestari', 'Gunawan', 'Permata', 'Wibowo', 'Anggraini', 'Sapto', 'Kurniati', 'Yusuf', 'Fitri'];

        const agents = [];
        for (let i = 0; i < 35; i++) {
            const first = firstNames[Math.floor(Math.random() * firstNames.length)];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${first} ${last}`;
            const email = `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`;
            const phone = generateRandomPhone();
            const status = Math.random() > 0.1 ? 'active' : 'inactive';
            agents.push([name, email, phone, status]);
        }
        await executeQuery('INSERT INTO agents (name, email, phone, status) VALUES ?', [agents]);
        console.log('seeded agents');

        // --- 2. SEED CAMPUSES ---
        const cityNames = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Yogyakarta', 'Malang', 'Denpasar', 'Bogor', 'Depok', 'Tangerang', 'Bekasi', 'Solo', 'Padang', 'Pekanbaru', 'Lampung', 'Balikpapan', 'Samarinda'];
        const campusTypes = ['Universitas', 'Institut', 'Sekolah Tinggi', 'Politeknik', 'Akademi'];
        const campusNamesMain = ['Merdeka', 'Nusantara', 'Indonesia', 'Harapan Bangsa', 'Cendekia', 'Teknologi', 'Sains', 'Mandiri', 'Utama', 'Mulia', 'Bhakti', 'Persada', 'Global', 'Madani', 'Unggul', 'Jaya', 'Karya', 'Abdi', 'Pertiwi', 'Sejahtera'];

        const campuses = [];
        for (let i = 0; i < 35; i++) {
            const type = campusTypes[Math.floor(Math.random() * campusTypes.length)];
            const main = campusNamesMain[Math.floor(Math.random() * campusNamesMain.length)];
            const city = cityNames[Math.floor(Math.random() * cityNames.length)];
            const name = `${type} ${main} ${city} ${i + 1}`; // Add index to ensure uniqueness if needed
            const code = `KMP${(1000 + i).toString()}`;
            const address = `Jl. Pendidikan No. ${Math.floor(Math.random() * 100)}, ${city}`;
            const apps = getRandomApps();
            const status = Math.random() > 0.1 ? 'active' : 'inactive';
            campuses.push([code, name, address, apps, status]);
        }
        await executeQuery('INSERT INTO campuses (code, name, address, applications, status) VALUES ?', [campuses]);
        console.log('seeded campuses');

        // --- 3. SEED SOURCES ---
        const sourceTypes = ['Webinar', 'Social Media', 'Referral', 'Exhibition', 'Visit', 'Email Campaign', 'Partner'];
        const sourceDetails = ['Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Alumni', 'Dosen', 'Event Jakarta', 'Event Surabaya', 'Website', 'WhatsApp'];

        const sources = [];
        for (let i = 0; i < 35; i++) {
            const type = sourceTypes[Math.floor(Math.random() * sourceTypes.length)];
            const detail = sourceDetails[Math.floor(Math.random() * sourceDetails.length)];
            const name = `${type} - ${detail} V${i + 1}`;
            sources.push([name]);
        }
        await executeQuery('INSERT INTO sources (name) VALUES ?', [sources]);
        console.log('seeded sources');

        // --- 4. SEED SCOPES ---
        const scopeActions = ['Migrasi', 'Instalasi', 'Training', 'Pendampingan', 'Integrasi', 'Maintenance', 'Customization', 'Consultation', 'Review', 'Audit'];
        const scopeTargets = ['Database', 'Server', 'SIAKAD', 'Feeder', 'SISTER', 'API', 'Network', 'Security', 'Reporting', 'Module'];

        const scopes = [];
        for (let i = 0; i < 35; i++) {
            const action = scopeActions[Math.floor(Math.random() * scopeActions.length)];
            const target = scopeTargets[Math.floor(Math.random() * scopeTargets.length)];
            const name = `${action} ${target} - Level ${Math.floor(Math.random() * 3) + 1}`;
            scopes.push([name]);
        }
        await executeQuery('INSERT INTO scopes (name) VALUES ?', [scopes]);
        console.log('seeded scopes');

        // --- 5. SEED MATERIALS ---
        const materialTopics = ['Penggunaan', 'Administrasi', 'Konfigurasi', 'Troubleshooting', 'Manajemen', 'Pelaporan', 'Optimasi', 'Instalasi', 'Keamanan', 'Audit'];
        const materialModules = ['SIAKAD', 'Keuangan', 'Kepegawaian', 'Aset', 'Perpustakaan', 'PMB', 'Akademik', 'Host-to-Host', 'Mobile Apps', 'Dashboard'];

        const materials = [];
        for (let i = 0; i < 35; i++) {
            const topic = materialTopics[Math.floor(Math.random() * materialTopics.length)];
            const module = materialModules[Math.floor(Math.random() * materialModules.length)];
            const name = `Panduan ${topic} Modul ${module} V${2023 + Math.floor(Math.random() * 3)}`;
            materials.push([name]);
        }
        await executeQuery('INSERT INTO materials (name) VALUES ?', [materials]);
        console.log('seeded materials');

        // --- 6. SEED HOLIDAYS ---
        const holidayNames = ['Tahun Baru Masehi', 'Imlek', 'Nyepi', 'Wafat Isa Almasih', 'Lebaran Hari 1', 'Lebaran Hari 2', 'Waisak', 'Kenaikan Isa Almasih', 'Pancasila', 'Idul Adha', 'Tahun Baru Islam', 'Kemerdekaan RI', 'Maulid Nabi', 'Natal'];

        const holidays = [];
        let currentDate = new Date('2024-01-01');
        for (let i = 0; i < 40; i++) {
            // Pick a random date roughly every 2 weeks to spread them out
            currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 20) + 10);

            const dateStr = currentDate.toISOString().split('T')[0];
            const name = holidayNames[Math.floor(Math.random() * holidayNames.length)] + ` (${currentDate.getFullYear()})`;

            holidays.push([dateStr, name]);
        }
        await executeQuery('INSERT INTO holidays (date, name) VALUES ?', [holidays]);
        console.log('seeded holidays');

        console.log('All master data seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};
