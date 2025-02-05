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

// Fungsi untuk merender tabel kamar kos
async function renderRoomTable(rooms) {
  const container = document.querySelector(".cards-container");
  container.innerHTML = ""; // Menghapus konten sebelumnya

  if (!rooms || rooms.length === 0) {
    container.innerHTML = `
        <div class="card">
            <p>Tidak ada kamar kos yang ditemukan.</p>
        </div>
      `;
    return;
  }

  for (let room of rooms) {
    const {
      room_id,
      images,
      room_type,
      size,
      price,
      number_available,
      status,
      roomFacilities,
      customFacilities,
    } = room;

    // Buat tampilan semua gambar
    const imageGallery =
      images && images.length > 0
        ? images
            .map(
              (img) => `<img src="${img}" alt="Room Image" class="card-image">`
            )
            .join("")
        : `<p>Tidak ada gambar tersedia</p>`;

    // Buat tampilan fasilitas umum kamar
    const roomFacilityDisplay =
      roomFacilities.length > 0
        ? roomFacilities.map((facility) => `<li>${facility}</li>`).join("")
        : `<p>Tidak ada fasilitas tersedia</p>`;

    // Buat tampilan fasilitas custom kamar
    const customFacilityDisplay =
      customFacilities.length > 0
        ? customFacilities.map((facility) => `<li>${facility}</li>`).join("")
        : `<p>Tidak ada fasilitas custom tersedia</p>`;

    // Membuat card untuk setiap kamar kos
    container.innerHTML += `
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <h3>${room_type}</h3>
          </div>
        </div>

        <div class="card-content">
          <div class="left">
            <p><strong>Ukuran:</strong> ${size} m²</p>
            <p><strong>Harga:</strong> Rp ${price.toLocaleString()}</p>
            <p><strong>Kamar Tersedia:</strong> ${number_available}</p>
            <p><strong>Status:</strong> ${status}</p>
          </div>
          <div class="center">
            <p><strong>Fasilitas Kamar:</strong></p>
            <ul>${roomFacilityDisplay}</ul>
          </div>
          <div class="right">
            <p><strong>Fasilitas Custom:</strong></p>
            <ul>${customFacilityDisplay}</ul>
          </div>
        </div>

        <div class="card-gallery">
          <p><strong>Gambar Kamar:</strong></p>
          ${imageGallery}
        </div>
        <div class="card-button">
          <p><strong>Aksi</strong></p>
          <button class="btn btn-edit" onclick="location.href='edit_kamar.html?room_id=${room_id}'">Edit</button>
          <button class="btn btn-delete" onclick="deleteRoom('${room_id}')">Hapus</button>
        </div>
      </div>
    `;
  }
}

// Fungsi untuk memuat ulang data tanpa refresh halaman
async function reloadRoomData() {
  try {
    const authToken = getCookie("authToken");
    const urlParams = new URLSearchParams(window.location.search);
    const boardingHouseId = urlParams.get("boarding_house_id");

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
    if (!data || !data.data) {
      throw new Error("Data tidak valid atau tidak ada");
    }

    allRoomData = data.data;
    await renderRoomTable(allRoomData);
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}

// Ambil data saat halaman dimuat
window.onload = reloadRoomData;

// Fungsi untuk menghapus kamar kos
async function deleteRoom(roomId) {
  const confirmDelete = confirm("Apakah Anda yakin ingin menghapus kamar ini?");
  if (!confirmDelete) return;

  try {
    const authToken = getCookie("authToken");
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/${roomId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal menghapus kamar");
    }

    alert("Kamar berhasil dihapus!");
    reloadRoomData(); // Memuat ulang data tanpa refresh halaman
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat menghapus kamar.");
  }
}