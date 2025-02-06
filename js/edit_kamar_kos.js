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
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room_id");
let boardingHouseId = "";

// Fungsi untuk fetch data dan isi dropdown atau checkbox
async function fetchData(
  url,
  containerElement,
  keyId,
  keyName,
  isCheckbox = false,
  selectedValues = []
) {
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

    containerElement.innerHTML = isCheckbox
      ? ""
      : `<option value="">Pilih</option>`;

    listData.forEach((item) => {
      if (isCheckbox) {
        const checkboxWrapper = document.createElement("div");
        const checkboxInput = document.createElement("input");
        checkboxInput.type = "checkbox";
        checkboxInput.name = "fasilitasKos[]";
        checkboxInput.value = item[keyId];
        checkboxInput.id = `${containerElement.id}_${item[keyId]}`;

        if (selectedValues.includes(item[keyId])) {
          checkboxInput.checked = true;
        }

        const checkboxLabel = document.createElement("label");
        checkboxLabel.setAttribute("for", checkboxInput.id);
        checkboxLabel.textContent = item[keyName];

        checkboxWrapper.appendChild(checkboxInput);
        checkboxWrapper.appendChild(checkboxLabel);
        containerElement.appendChild(checkboxWrapper);
      } else {
        const option = document.createElement("option");
        option.value = item[keyId];
        option.textContent = item[keyName];
        containerElement.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// Fungsi untuk mengambil data kamar berdasarkan ID dan mengisi form
// Fungsi untuk mengambil data kamar berdasarkan ID dan mengisi form
async function fetchRoomData() {
  if (!roomId) {
    console.error("ID kamar tidak ditemukan.");
    return;
  }

  try {
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/${roomId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Gagal mengambil data kamar");

    const data = await response.json();
    const roomData = data.data;
    boardingHouseId = roomData.boarding_house_id;

    // Mengisi form dengan data kamar
    document.getElementById("size").value = roomData.size || "";
    document.getElementById("roomType").value = roomData.room_type || "";
    document.getElementById("numberAvailable").value =
      roomData.number_available || "";
    document.getElementById("hargaKamar1").value = roomData.price.monthly || "";
    document.getElementById("hargaKamar2").value =
      roomData.price.quarterly || "";
    document.getElementById("hargaKamar3").value =
      roomData.price.semi_annual || "";
    document.getElementById("hargaKamar4").value = roomData.price.yearly || "";

    // Menambahkan gambar yang sudah ada, jika ada
    const imageContainer = document.querySelector(".image-inputs");
    if (
      Array.isArray(roomData.images) &&
      roomData.images.length > 0
    ) {
      roomData.images.forEach((image, index) => {
        const imageElement = document.createElement("img");
        imageElement.src = image;
        imageElement.alt = `Gambar ${index + 1}`;
        imageElement.style.width = "100px"; // Gaya gambar jika perlu
        imageElement.style.marginRight = "5px"; // Agar ada jarak antar gambar
        imageContainer.appendChild(imageElement);
      });
    }

    await fetchData(
      "https://kosconnect-server.vercel.app/api/facility/type?type=room",
      document.getElementById("roomFacilities"),
      "facility_id",
      "name",
      true,
      roomData.room_facilities
    );
    await fetchData(
      "https://kosconnect-server.vercel.app/api/customFacilities/owner",
      document.getElementById("customFacilities"),
      "custom_facility_id",
      "name",
      true,
      roomData.custom_facilities
    );

    // Ambil nama boarding house dari endpoint detail
    const detailResponse = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/${roomId}/detail`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      document.getElementById(
        "header"
      ).innerHTML = `<h2>Form Edit Kamar Kos - ${detailData[0].boarding_house_name}</h2>`;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchRoomData);

document
  .getElementById("formEditRoom")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const roomType = document.getElementById("roomType").value;
    const size = document.getElementById("size").value;
    const numberAvailable = document.getElementById("numberAvailable").value;
    const hargaKamar1 = document.getElementById("hargaKamar1").value;
    const hargaKamar2 = document.getElementById("hargaKamar2").value;
    const hargaKamar3 = document.getElementById("hargaKamar3").value;
    const hargaKamar4 = document.getElementById("hargaKamar4").value;

    const fasilitasKos = Array.from(
      document.querySelectorAll("input[name='fasilitasKos[]']:checked")
    ).map((opt) => opt.value);
    const customFacilities = Array.from(
      document.querySelectorAll("input[name='customFacilities[]']:checked")
    ).map((opt) => opt.value);

    const imageInputs = document.querySelectorAll("input[name='images[]']");

    let imageCount = 0;
    const formData = new FormData();

    imageInputs.forEach((input) => {
      if (input.files.length > 0) {
        formData.append("images", input.files[0]);
        imageCount++;
      }
    });

    if (imageCount > 5) {
      alert("Anda hanya bisa mengunggah maksimal 5 gambar.");
      return;
    }

    // Menambahkan data kamar ke FormData
    formData.append("room_type", roomType);
    formData.append("size", size);
    formData.append("number_available", numberAvailable);
    formData.append("price_monthly", hargaKamar1);
    formData.append("price_quarterly", hargaKamar2);
    formData.append("price_semi_annual", hargaKamar3);
    formData.append("price_yearly", hargaKamar4);

    formData.append("room_facilities", JSON.stringify(fasilitasKos));
    formData.append("custom_facilities", JSON.stringify(customFacilities));

    try {
      const response = await fetch(
        `https://kosconnect-server.vercel.app/api/rooms/${roomId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Gagal memperbarui data kamar");

      alert("Kamar berhasil diperbarui!");
      window.location.href = `manajemen_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat memperbarui kamar.");
    }
  });

document.getElementById("btnBatal")?.addEventListener("click", () => {
  window.location.href = `manajemen_kamar_kos.html?boarding_house_id=${boardingHouseId}`;
});
