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

    if (boardingHouses.length === 0) {
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
                <button class="btn btn-add" onclick="tambahKamarKos('${boarding_house_id}')">Tambah Kamar Kos</button>
                <button class="btn btn-edit" onclick="editBoardingHouse('${boarding_house_id}')">Edit</button> 
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
        allBoardingHouseData = data.data; // Ambil array dari 'data'
        await renderBoardingHouseTable(allBoardingHouseData);
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
};
