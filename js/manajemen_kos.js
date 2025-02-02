// Fungsi untuk membaca nilai cookie berdasarkan nama
function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Variabel global untuk menyimpan semua data boarding houses
let allBoardingHouseData = [];

// Fungsi untuk merender tabel boarding house
async function renderBoardingHouseTable(boardingHouses) {
    const container = document.querySelector(".cards-container");
    container.innerHTML = ""; // Menghapus konten sebelumnya

    // Cek apakah boardingHouses berisi data yang valid
    if (!boardingHouses || boardingHouses.length === 0) {
        container.innerHTML = `
        <div class="card">
            <p>Tidak ada boarding house yang ditemukan.</p>
        </div>
      `;
        return;
    }

    // Ambil detail untuk setiap boarding house
    for (let boardingHouse of boardingHouses) {
        const { boarding_house_id, images, name, address, description, rules } = boardingHouse;

        // Ambil detail (full_name dan category_name) untuk setiap boarding house
        const detailResponse = await fetch(`https://kosconnect-server.vercel.app/api/boardingHouses/${boarding_house_id}/detail`);
        const detail = await detailResponse.json();
        
        // Ambil data full_name (owner) dan category_name dari detail
        // const ownerName = detail[0]?.owner_fullname || "Owner Tidak Diketahui"; 
        const categoryName = detail[0]?.category_name || "Kategori Tidak Diketahui";

    // Membuat card untuk setiap boarding house
    container.innerHTML += `
        <div class="card">
            <img src="${images[0]}" alt="Kos Image" class="card-image">
            <div class="card-content">
                <h3>${name}</h3>
                <p>Alamat: ${address}</p>
                <p>Kategori: ${categoryName}</p>
                <p>Deskripsi: ${description}</p>
                <p>Aturan: ${rules}</p>

                <h3>Aksi</h3>
                <button class="btn btn-lihat"onclick="location.href='manajemen_kamar_kos.html?boarding_house_id=${boarding_house_id}')>Lihat Kamar Kos</button>
                <button class="btn btn-edit" onclick="location.href='edit_kos.html?boarding_house_id=${boarding_house_id}'">Edit</button>
                <button class="btn btn-delete" onclick="deleteBoardingHouse('${boarding_house_id}')">Hapus</button>
            </div>
        </div>
    `;
}
}

function tambahKamarKos(boardingHouseId) {
    window.location.href = `tambah_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
}

// Ambil data boarding house saat halaman dimuat
window.onload = async () => {
    try {
        const authToken = getCookie("authToken");
        const response = await fetch(
            "https://kosconnect-server.vercel.app/api/boardingHouses/owner",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil data boarding house");
        }

        const data = await response.json(); // Dapatkan data dalam bentuk JSON
        if (!data || !data.data) {
            throw new Error("Data tidak valid atau tidak ada");
        }

        allBoardingHouseData = data.data; // Ambil array dari 'data'
        await renderBoardingHouseTable(allBoardingHouseData);
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
};

async function deleteBoardingHouse(boardingHouseId) {
    const confirmDelete = confirm("Apakah Anda yakin ingin menghapus kos ini?");

    if (!confirmDelete) return; // Jika user membatalkan, tidak lanjutkan

    try {
        const authToken = getCookie("authToken");
        const response = await fetch(`https://kosconnect-server.vercel.app/api/boardingHouses/${boardingHouseId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}` // Pastikan token sudah disertakan
            }
        });

        if (!response.ok) {
            throw new Error("Gagal menghapus kos");
        }

        alert("Kos berhasil dihapus!");
        window.location.href = 'manajemen_kos.html'; // Kembali ke halaman manajemen kos
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat menghapus kos.");
    }
}
