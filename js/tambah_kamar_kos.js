// Fungsi untuk mendapatkan JWT token dari cookie
function getJwtToken() {
  const cookies = document.cookie.split("; ");
  for (let cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === "authToken") {
      return decodeURIComponent(value);
    }
  }
  console.error("Token tidak ditemukan.");
  return null;
}

// Ambil token dari cookie
const token = getJwtToken();

// Fungsi untuk mengambil boardingHouseID dari URL
function getBoardingHouseIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("boarding_house_id");
}

// Fungsi untuk fetch boarding house berdasarkan ID
async function fetchBoardingHouse() {
  const boardingHouseId = getBoardingHouseIdFromURL();
  if (!boardingHouseId) {
    console.error("Boarding House ID tidak ditemukan di URL.");
    return;
  }

  if (!token) {
    console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
    return;
  }

  try {
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/boardingHouses/${boardingHouseId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Gagal mengambil data boarding house");

    const data = await response.json();
    if (!data.boardingHouse || !data.boardingHouse.name) {
      throw new Error("Data boarding house tidak memiliki properti 'name'");
    }

    document.getElementById(
      "header"
    ).innerHTML = `<h2>Form Tambah Kamar Kos - ${data.boardingHouse.name}</h2>`;
  } catch (error) {
    console.error("Error:", error);
  }
}

// Panggil fetchBoardingHouse saat halaman dimuat
document.addEventListener("DOMContentLoaded", fetchBoardingHouse);

// Fungsi untuk fetch data dan isi checkbox
async function fetchData(url, containerElement, keyId, keyName) {
  if (!token) {
    console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Gagal mengambil data");

    const data = await response.json();
    const listData = data.data || data;

    if (!Array.isArray(listData)) {
      throw new Error("Format data tidak sesuai");
    }

    containerElement.innerHTML = "";

    listData.forEach((item) => {
      const checkboxWrapper = document.createElement("div");
      const checkboxInput = document.createElement("input");
      checkboxInput.type = "checkbox";
      checkboxInput.name = containerElement.id + "[]";
      checkboxInput.value = item[keyId];
      checkboxInput.id = `${containerElement.id}_${item[keyId]}`;

      const checkboxLabel = document.createElement("label");
      checkboxLabel.setAttribute("for", checkboxInput.id);
      checkboxLabel.textContent = item[keyName];

      checkboxWrapper.appendChild(checkboxInput);
      checkboxWrapper.appendChild(checkboxLabel);
      containerElement.appendChild(checkboxWrapper);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// Fungsi untuk fetch fasilitas umum dan tambahan
async function fetchFacilities() {
  if (!token) {
    console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
    return;
  }

  const fasilitasKamarContainer = document.getElementById("fasilitasKamar");
  const fasilitasTambahanContainer =
    document.getElementById("fasilitasTambahan");

  // Fetch fasilitas umum tanpa owner_id
  fetchData(
    "https://kosconnect-server.vercel.app/api/facility/type?type=room",
    fasilitasKamarContainer,
    "facility_id",
    "name"
  );

  // Fetch fasilitas tambahan
  fetchData(
    "https://kosconnect-server.vercel.app/api/customFacilities/owner",
    fasilitasTambahanContainer,
    "custom_facility_id", // Ubah keyId sesuai respons backend
    "name"
  );
}

// Panggil fungsi untuk mengisi fasilitas saat halaman dimuat
document.addEventListener("DOMContentLoaded", fetchFacilities);

// Fungsi untuk menangani submit form
document
  .getElementById("formTambahKamar")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const boardingHouseId = getBoardingHouseIdFromURL();
    if (!boardingHouseId) {
      alert("Boarding House ID tidak ditemukan di URL.");
      return;
    }

    const tipeKamar = document.getElementById("tipeKamar").value;
    const ukuranKamar = document.getElementById("ukuranKamar").value;
    const hargaKamar = Array.from(document.querySelectorAll(".hargaKamar"))
      .map((input) => input.value.trim())
      .filter((harga) => harga !== "" && !isNaN(harga))
      .map(Number);

    const kamarTersedia = document.getElementById("kamarTersedia").value;
    const fasilitasKamar = Array.from(
      document.querySelectorAll("input[name='fasilitasKamar[]']:checked")
    ).map((opt) => opt.value);
    const fasilitasTambahan = Array.from(
      document.querySelectorAll("input[name='fasilitasTambahan[]']:checked")
    ).map((opt) => opt.value); // Perbaikan: Menghapus filter undefined

    const imageInputs = document.querySelectorAll(
      "input[name='imagesKamar[]']"
    );

    if (hargaKamar.length === 0) {
      alert("Minimal satu harga harus diisi!");
      return;
    }

    let imageCount = 0;
    const formData = new FormData();

    imageInputs.forEach((input) => {
      if (input.files.length > 0) {
        formData.append("images", input.files[0]);
        imageCount++;
      }
    });

    if (imageCount < 1) {
      alert("Minimal satu gambar kamar harus diunggah!");
      return;
    }

    if (imageCount > 5) {
      alert("Anda hanya bisa mengunggah maksimal 5 gambar.");
      return;
    }

    formData.append("room_type", tipeKamar);
    formData.append("size", ukuranKamar);
    formData.append("price_monthly", hargaKamar[0]); // Harga pertama
    formData.append("price_quarterly", hargaKamar[1] || 0);
    formData.append("price_semi_annual", hargaKamar[2] || 0);
    formData.append("price_yearly", hargaKamar[3] || 0);
    formData.append("number_available", kamarTersedia);
    formData.append("room_facilities", JSON.stringify(fasilitasKamar));
    formData.append("custom_facilities", JSON.stringify(fasilitasTambahan)); // Perbaikan di sini

    try {
      const response = await fetch(
        `https://kosconnect-server.vercel.app/api/rooms/${boardingHouseId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Gagal menyimpan data");

      alert("Kamar berhasil ditambahkan!");
      window.location.href = `manajemen_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat menambahkan kamar.");
    }
  });

// Tombol Batal
const btnBatal = document.getElementById("btnBatal");
if (btnBatal) {
  btnBatal.addEventListener("click", () => {
    location.href = `manajemen_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
  });
}

// Tombol Back (jika ada)
document.addEventListener("click", (event) => {
  if (event.target.id === "btnBack") {
    location.href = "manajemen_kos.html";
  }
});
