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

// Fungsi untuk mendapatkan parameter query dari URL
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Variabel global untuk menyimpan semua data kamar kos
let allRoomData = [];

// Fungsi untuk merender tabel kamar kos
async function renderRoomTable(rooms) {
    const container = document.querySelector(".cards-container");
    container.innerHTML = ""; // Menghapus konten sebelumnya

    if (rooms.length === 0) {
        container.innerHTML = `
        <div class="card">
            <p>Tidak ada kamar kos yang ditemukan.</p>
        </div>
      `;
        return;
    }

    // Ambil detail untuk setiap kamar
    for (let room of rooms) {
        const { room_id, images, room_type, size, price, status, number_available } = room;

        try {
            // Ambil detail kamar dari API
            const detailResponse = await fetch(`https://kosconnect-server.vercel.app/api/rooms/${room_id}/detail`);
            if (!detailResponse.ok) throw new Error("Gagal mengambil detail kamar");

            const detail = await detailResponse.json();

            // const ownerName = detail[0]?.owner_name || "Owner Tidak Diketahui";
            const boardingHouseName = detail[0]?.boarding_house_name || "Tidak tersedia";
            const roomFacilities = detail[0]?.room_facilities && Array.isArray(detail[0]?.room_facilities)
                ? detail[0]?.room_facilities.join(", ")
                : "Tidak ada fasilitas";
                const customFacilities = detail[0]?.custom_facility_details && Array.isArray(detail[0]?.custom_facility_details)
                ? `<ul>` + detail[0].custom_facility_details.map(facility => 
                    `<li>${facility.name} (Rp ${facility.price.toLocaleString("id-ID")})</li>`
                  ).join("") + `</ul>`
                : "Tidak ada fasilitas tambahan";                      

              // Format harga berdasarkan periode
              const priceTypes = {
                monthly: "bulan",
                quarterly: "3 bulan",
                semi_annual: "6 bulan",
                yearly: "tahun",
            };

            let priceListHTML = "<ul>";
            if (price && typeof price === "object") {
                Object.entries(priceTypes).forEach(([key, label]) => {
                    if (price[key]) {
                        priceListHTML += `<li>Rp ${price[key].toLocaleString("id-ID")} / ${label}</li>`;
                    }
                });
            }
            priceListHTML += "</ul>";

            // Membuat card untuk setiap kamar kos
            container.innerHTML += `
            <div class="card">
            <img src="${images[0]}" alt="Room Image" class="card-image">
            <div class="card-content">
                    <h3>${room_type}</h3>
                    <p>Nama Kos: ${boardingHouseName}</p>
                    <p>Ukuran: ${size}</p>
                    <p>Harga:</p>
                     ${priceListHTML}
                    <p>Status: ${status}</p>
                    <p>Kamar Tersedia: ${number_available}</p>
                    <p>Fasilitas: ${roomFacilities}</p>
                    <p>Fasilitas Custom: ${customFacilities}</p>

                    <h3>Aksi</h3>
                    <button class="btn btn-primary" onclick="editRoom('${room_id}')">Edit</button>
                    <button class="btn btn-primary" onclick="deleteRoom('${room_id}')">Hapus</button>
                    <button class="btn btn-primary" onclick="window.location.href='manajemen_kos.html'"><i class="fas fa-arrow-left"></i> Kembali</button>
                </div>
            </div>
            `;
        } catch (error) {
            console.error(`Gagal mengambil detail untuk room_id: ${room_id}`, error);
        }
    }
}

// Ambil data kamar kos saat halaman dimuat
window.onload = async () => {
    try {
        const authToken = getCookie("authToken");

        // Ambil boardingHouseID dari URL (gunakan URLSearchParams)
        const boardingHouseID = getQueryParameter("boarding_house_id"); // Ambil dari URL

        // Pastikan boardingHouseID ada
        if (!boardingHouseID) {
            throw new Error("Boarding House ID tidak ditemukan");
        }

        const response = await fetch(
            `https://kosconnect-server.vercel.app/api/rooms/boarding-house/${boardingHouseID}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil data kamar kos");
        }

        const data = await response.json(); // Dapatkan data dalam bentuk JSON
        allRoomData = data.data; // Ambil array dari 'data'
        await renderRoomTable(allRoomData);
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
};

document.getElementById("btnTambahKamarKos").addEventListener("click", function() {
    // Ambil boarding_house_id dari URL halaman manajemen_kamar_kos
    const boardingHouseId = getBoardingHouseIdFromURL();
    
    // Cek apakah boarding_house_id ada
    if (boardingHouseId) {
        // Arahkan ke halaman tambah kamar kos dengan membawa boarding_house_id di URL
        const url = `tambah_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
        window.location.href = url;
    } else {
        alert("ID kos tidak ditemukan.");
    }
});


// DELETE
// Fungsi untuk membaca boarding_house_id dari URL
function getBoardingHouseIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("boarding_house_id");
}

async function deleteRoom(roomId) {
    const confirmDelete = confirm("Apakah Anda yakin ingin menghapus kamar kos ini?");

    if (!confirmDelete) return; // Jika user membatalkan, tidak lanjutkan

    try {
        const authToken = getCookie("authToken"); // Ambil token dari cookie
        const response = await fetch(`https://kosconnect-server.vercel.app/api/rooms/${roomId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}` // Pastikan token sudah disertakan
            }
        });

        if (!response.ok) {
            throw new Error("Gagal menghapus kamar kos");
        }

        alert("Kamar kos berhasil dihapus!");
        window.location.href = 'manajemen_kamar_kos.html'; // Kembali ke halaman manajemen kamar kos
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat menghapus kamar kos.");
    }
}
