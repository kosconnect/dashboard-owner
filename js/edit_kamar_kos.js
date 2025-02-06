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

const token = getJwtToken();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room_id");
let boardingHouseId = "";

async function fetchData(
  url,
  containerElement,
  keyId,
  keyName,
  isCheckbox = false,
  includePrice = false
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
        checkboxInput.name =
          containerElement.id === "customFacilities"
            ? "customFacilities[]"
            : "roomFacilities[]";
        checkboxInput.value = item[keyId];
        checkboxInput.id = `${containerElement.id}_${item[keyId]}`;

        const checkboxLabel = document.createElement("label");
        checkboxLabel.setAttribute("for", checkboxInput.id);
        checkboxLabel.textContent = item[keyName];

        checkboxWrapper.appendChild(checkboxInput);
        checkboxWrapper.appendChild(checkboxLabel);

        if (includePrice && containerElement.id === "customFacilities") {
          const priceSpan = document.createElement("span");
          priceSpan.textContent = ` - Rp ${item.price}`;
          checkboxWrapper.appendChild(priceSpan);
        }

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
      Array.isArray(data.boardingHouse.images) &&
      data.boardingHouse.images.length > 0
    ) {
      data.boardingHouse.images.forEach((image, index) => {
        const imageElement = document.createElement("img");
        imageElement.src = image;
        imageElement.alt = `Gambar ${index + 1}`;
        imageElement.style.width = "100px"; // Gaya gambar jika perlu
        imageContainer.appendChild(imageElement);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchBoardingHouseName() {
  if (!roomId) return;
  try {
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/${roomId}/detail`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Gagal mengambil nama kos");
    const data = await response.json();
    document.getElementById(
      "header"
    ).innerHTML = `<h2>Form Tambah Kamar Kos - ${data.boarding_house_name}</h2>`;
  } catch (error) {
    console.error("Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchRoomData();
  await fetchBoardingHouseName();
  await fetchData(
    "https://kosconnect-server.vercel.app/api/facility/type?type=room",
    document.getElementById("roomFacilities"),
    "facility_id",
    "name",
    true
  );
  await fetchData(
    "https://kosconnect-server.vercel.app/api/customFacilities/owner",
    document.getElementById("customFacilities"),
    "custom_facility_id",
    "name",
    true,
    true
  );
});

document
  .getElementById("formEditRoom")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append(
      "room_facilities",
      JSON.stringify(
        [
          ...document.querySelectorAll(
            "input[name='roomFacilities[]']:checked"
          ),
        ].map((opt) => opt.value)
      )
    );
    formData.append(
      "custom_facilities",
      JSON.stringify(
        [
          ...document.querySelectorAll(
            "input[name='fasilitasTambahan[]']:checked"
          ),
        ].map((opt) => opt.value)
      )
    );

    try {
      const response = await fetch(
        `https://kosconnect-server.vercel.app/api/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
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
