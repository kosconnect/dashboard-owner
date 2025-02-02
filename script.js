function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown-menu');
    dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
}

document.addEventListener("DOMContentLoaded", () => {
    // Fungsi membaca nilai cookie berdasarkan nama
    function getCookie(name) {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [key, value] = cookie.split("=");
            if (key === name) return decodeURIComponent(value);
        }
        return null;
    }

    // Ambil token dan elemen yang dibutuhkan
    const authToken = getCookie("authToken");
    const userRole = getCookie("userRole");
    const userNameElement = document.querySelector(".user-dropdown .name");

    if (authToken) {
        fetch("https://kosconnect-server.vercel.app/api/users/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch user data");
                return response.json();
            })
            .then(data => {
                const user = data.user;
                const userName = user?.fullname || userRole || "Pemilik KOs Tidak Diketahui";
                userNameElement.textContent = userName;
            })
            .catch(error => {
                console.error("Error fetching user data:", error);
                userNameElement.textContent = userRole || "Guest";
            });
    } else {
        userNameElement.textContent = "Guest";
    }

    // Logika logout
    const logoutBtn = document.querySelector(".dropdown-menu li a");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (event) => {
            event.preventDefault();
            document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure";
            document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure";

            // Arahkan ke halaman login setelah logout
            window.location.href = "https://kosconnect.github.io/login/";
        });
    }
});

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