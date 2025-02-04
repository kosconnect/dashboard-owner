   
// Fungsi untuk mengambil data dari API Total Kos
async function getTotalKos() {
    try {
        const token = getCookie('authToken'); // Ambil token dari cookie
        const kosResponse = await fetch('https://kosconnect-server.vercel.app/api/boardingHouses/owner', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Menambahkan token pada header
            }
        });
        const kosData = await kosResponse.json();

        // Tampilkan jumlah kos pada widget
        document.getElementById('total-kos').innerText = kosData.length; // Jumlah data kos
    } catch (error) {
        console.error('Error fetching kos data:', error);
    }
}

// Panggil fungsi untuk mendapatkan total kos
getTotalKos();

// Fungsi untuk mengambil data dari API Total Kamar
async function getTotalKamar() {
    try {
        const token = getCookie('authToken'); // Ambil token dari cookie
        const boardingHouseResponse = await fetch('https://kosconnect-server.vercel.app/api/boardingHouses/owner', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Menambahkan token pada header
            }
        });
        const boardingHouseData = await boardingHouseResponse.json();

        // Ambil boardingHouseId dari response boardingHouse
        const boardingHouseId = boardingHouseData[0]?.id; // Pastikan ada data di array

        // Ambil data kamar kos berdasarkan boardingHouseId
        if (boardingHouseId) {
            const roomsResponse = await fetch(`https://kosconnect-server.vercel.app/api/rooms/boarding-house/${boardingHouseId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}` // Menambahkan token pada header
                }
            });
            const roomsData = await roomsResponse.json();

            // Tampilkan jumlah kamar kos pada widget
            document.getElementById('total-kamar').innerText = roomsData.length;
        }
    } catch (error) {
        console.error('Error fetching rooms data:', error);
    }
}

// Panggil fungsi untuk mendapatkan total kamar kos
getTotalKamar();

// Fungsi untuk mendapatkan total transaksi
async function getTotalTransaksi() {
    try {
        const token = getCookie('authToken'); // Ambil token dari cookie
        const transaksiResponse = await fetch('https://kosconnect-server.vercel.app/api/transaction/owner', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Menambahkan token pada header
            }
        });
        const transaksiData = await transaksiResponse.json();

        // Tampilkan total transaksi
        document.getElementById('total-transaksi').innerText = transaksiData.length;
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

// Panggil fungsi untuk mendapatkan total transaksi
getTotalTransaksi();