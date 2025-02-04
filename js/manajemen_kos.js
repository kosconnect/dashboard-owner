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
    const { boarding_house_id, images, name, address, description, rules } =
      boardingHouse;

    try {
      const detailResponse = await fetch(
        `https://kosconnect-server.vercel.app/api/boardingHouses/${boarding_house_id}/detail`
      );
      const detail = await detailResponse.json();

      // Pastikan detail[0] ada sebelum mengakses propertinya
      const categoryName =
        detail.length > 0
          ? detail[0]?.category_name
          : "Kategori Tidak Diketahui";

      // Buat tampilan semua gambar
      const imageGallery = images
        .map((img) => `<img src="${img}" alt="Kos Image" class="card-image">`)
        .join("");

      // Membuat card untuk setiap boarding house
      container.innerHTML += `
        <div class="card">
            <div class="image-gallery">${imageGallery}</div>
            <div class="card-content">
                <h3>${name}</h3>
                <dl>
                    <dt>Alamat:</dt><dd>${address}</dd>
                    <dt>Deskripsi:</dt><dd>${description}</dd>
                    <dt>Aturan:</dt><dd>${rules}</dd>
                </dl>
                <h3>Aksi</h3>
                <button class="btn btn-lihat" onclick="redirectToRoomManagement('${boarding_house_id}')">Lihat Kamar Kos</button>
                <button class="btn btn-edit" onclick="location.href='edit_kos.html?boarding_house_id=${boarding_house_id}'">Edit</button>
                <button class="btn btn-delete" onclick="deleteBoardingHouse('${boarding_house_id}')">Hapus</button>
            </div>
        </div>
      `;
    } catch (error) {
      console.error(`Gagal mengambil detail untuk Kos ${name}:`, error);
    }
  }
}

function redirectToRoomManagement(boardingHouseId) {
  if (!boardingHouseId) {
    const userResponse = confirm(
      "Kos ini belum memiliki kamar. Tambah kamar kos sekarang?"
    );
    if (userResponse) {
      window.location.href = "manajemen_kamar_kos.html";
    } else {
      window.location.href = "manajemen_kos.html";
    }
  } else {
    window.location.href = `manajemen_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
  }
}

// Fungsi untuk memuat ulang data tanpa refresh halaman
async function reloadBoardingHouseData() {
  try {
    const authToken = getCookie("authToken");
    const response = await fetch(
      "https://kosconnect-server.vercel.app/api/boardingHouses/owner",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal mengambil data boarding house");
    }

    const data = await response.json();
    if (!data || !data.data) {
      throw new Error("Data tidak valid atau tidak ada");
    }

    allBoardingHouseData = data.data;
    await renderBoardingHouseTable(allBoardingHouseData);
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}

// Ambil data saat halaman dimuat
window.onload = reloadBoardingHouseData;

// Fungsi untuk menghapus boarding house
async function deleteBoardingHouse(boardingHouseId) {
  const confirmDelete = confirm("Apakah Anda yakin ingin menghapus kos ini?");
  if (!confirmDelete) return;

  try {
    const authToken = getCookie("authToken");
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/boardingHouses/${boardingHouseId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal menghapus kos");
    }

    alert("Kos berhasil dihapus!");
    reloadBoardingHouseData(); // Memuat ulang data tanpa refresh halaman
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat menghapus kos.");
  }
}