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

// Variabel global untuk menyimpan semua data kamar kos
let allRoomData = [];

// Konversi harga berdasarkan jenis sewa
const priceTypes = {
  monthly: "bulan",
  quarterly: "3 bulan",
  semi_annual: "6 bulan",
  yearly: "tahun",
};

// Fungsi untuk merender tabel kamar kos
async function renderRoomTable(rooms) {
  const container = document.querySelector(".cards-container");
  container.innerHTML = "";

  if (!rooms || rooms.length === 0) {
    const userChoice = confirm(
      "Belum ada kamar kos yang tersedia. Tambahkan kamar sekarang?"
    );
    if (userChoice) {
      const urlParams = new URLSearchParams(window.location.search);
      const boardingHouseId = urlParams.get("boarding_house_id");
      location.href = `tambah_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
    } else {
      location.href = "manajemen_kos.html";
    }
    return;
  }

  for (let room of rooms) {
    const {
      room_id,
      room_type,
      size,
      price,
      number_available,
      status,
      images,
    } = room;

    // Ambil detail kamar untuk mendapatkan fasilitas dan boarding house name
    const authToken = getCookie("authToken");
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/${room_id}/detail`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const roomDetail = await response.json();
    const room_facilities = roomDetail[0]?.room_facilities || [];
    const custom_facility_details =
      roomDetail[0]?.custom_facility_details || [];

    // Memastikan gambar kamar adalah array
    const imageGallery =
      images && Array.isArray(images) && images.length > 0
        ? images
            .map(
              (img) => `<img src="${img}" alt="Room Image" class="card-image">`
            )
            .join("")
        : `<p>Tidak ada gambar tersedia</p>`;

    const roomFacilityDisplay =
      room_facilities.length > 0
        ? room_facilities.map((facility) => `<li>${facility}</li>`).join("")
        : `<p>Tidak ada fasilitas tersedia</p>`;

    const customFacilityDisplay =
      custom_facility_details.length > 0
        ? custom_facility_details
            .map(
              (facility) =>
                `<li>${facility.name} - Rp ${facility.price.toLocaleString(
                  "id-ID"
                )}</li>`
            )
            .join("")
        : `<p>Tidak ada fasilitas custom tersedia</p>`;

    let priceDisplay = "<p><strong>Harga:</strong></p><ul>";
    if (price && typeof price === "object") {
      Object.entries(priceTypes).forEach(([key, label]) => {
        if (price[key]) {
          priceDisplay += `<li>Rp ${price[key].toLocaleString(
            "id-ID"
          )} / ${label}</li>`;
        }
      });
    }
    priceDisplay += "</ul>";

    container.innerHTML += `
      <div class="card">
        <div class="card-header"><h3>${room_type}</h3></div>
        <div class="card-content">
          <div class="left">
            <p><strong>Ukuran:</strong> ${size} m²</p>
            ${priceDisplay}
            <p><strong>Kamar Tersedia:</strong> ${number_available}</p>
            <p><strong>Status:</strong> ${status}</p>
          </div>
          <div class="center">
            <p><strong>Fasilitas Kamar:</strong></p>
            <div class="facility-list">
              <ul>${roomFacilityDisplay}</ul>
            </div>
          </div>
          <div class="right">
            <p><strong>Fasilitas Custom:</strong></p>
            <div class="facility-list">
              <ul>${customFacilityDisplay}</ul>
            </div>
          </div>
        </div>
        <div class="card-gallery">
          <p><strong>Gambar Kamar:</strong></p>
          ${imageGallery}
        </div>
        <div class="card-button">
          <button class="btn btn-edit" onclick="location.href='edit_kamar_kos.html?room_id=${room_id}'">Edit</button>
          <button class="btn btn-delete" onclick="deleteRoom('${room_id}')">Hapus</button>
        </div>
      </div>
    `;
  }
}

// Fungsi untuk menghapus kamar
async function deleteRoom(room_id) {
  if (!confirm("Apakah Anda yakin ingin menghapus kamar ini?")) return;

  try {
    const authToken = getCookie("authToken");
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/${room_id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal menghapus kamar");
    }

    alert("Kamar berhasil dihapus");
    reloadRoomData();
  } catch (error) {
    console.error("Gagal menghapus kamar:", error);
    alert("Terjadi kesalahan saat menghapus kamar");
  }
}

// Fungsi untuk memuat ulang data kamar
async function reloadRoomData() {
  try {
    const authToken = getCookie("authToken");
    const urlParams = new URLSearchParams(window.location.search);
    const boardingHouseId = urlParams.get("boarding_house_id");

    // Ambil data kamar kos dan gambar kamar
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/boarding-house/${boardingHouseId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal mengambil data kamar kos");
    }

    const data = await response.json();
    allRoomData = data.data || [];

    // Update header dengan boarding house name dari room pertama
    if (allRoomData.length > 0) {
      const roomDetail = await fetch(
        `https://kosconnect-server.vercel.app/api/rooms/${allRoomData[0].room_id}/detail`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const roomDetailData = await roomDetail.json();
      const boardingHouseName =
        roomDetailData[0]?.boarding_house_name || "Boarding House";

      document.getElementById("header").innerHTML = `
        <div class="header-container">
          <h1>Daftar Kamar Kos - ${boardingHouseName}</h1>
          <button id="btnBack" class="btnBack">Back</button>
        </div>
      `;
    }

    await renderRoomTable(allRoomData);
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}

// Event listener untuk tombol "Tambah Kamar Kos"
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const boardingHouseId = urlParams.get("boarding_house_id");

  const btnTambah = document.getElementById("btnTambahKamarKos");
  if (btnTambah) {
    btnTambah.addEventListener("click", () => {
      location.href = `tambah_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.id === "btnBack") {
      location.href = "manajemen_kos.html";
    }
  });
});

// Ambil data saat halaman dimuat
window.onload = reloadRoomData;