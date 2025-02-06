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
  nameAttribute,
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

    containerElement.innerHTML = "";

    listData.forEach((item) => {
      const checkboxWrapper = document.createElement("div");
      const checkboxInput = document.createElement("input");
      checkboxInput.type = "checkbox";
      checkboxInput.name = nameAttribute;
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
    });
  } catch (error) {
    console.error("Error:", error);
  }
}
async function fetchCustomFacilities(
  url,
  containerElement,
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

    if (!response.ok) throw new Error("Gagal mengambil data custom facility");

    const data = await response.json();
    const listData = data.data || data;

    if (!Array.isArray(listData)) {
      throw new Error("Format data custom facility tidak sesuai");
    }

    containerElement.innerHTML = "";

    listData.forEach((item) => {
      const checkboxWrapper = document.createElement("div");
      const checkboxInput = document.createElement("input");
      checkboxInput.type = "checkbox";
      checkboxInput.name = "customFacilities[]";
      checkboxInput.value = item.custom_facility_id;
      checkboxInput.id = `custom_${item.custom_facility_id}`;

      if (selectedValues.includes(item.custom_facility_id)) {
        checkboxInput.checked = true;
      }

      // Format harga menjadi Rupiah
      const formattedPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(item.price);

      const checkboxLabel = document.createElement("label");
      checkboxLabel.setAttribute("for", checkboxInput.id);
      checkboxLabel.textContent = `${item.name} - ${formattedPrice}`;

      checkboxWrapper.appendChild(checkboxInput);
      checkboxWrapper.appendChild(checkboxLabel);
      containerElement.appendChild(checkboxWrapper);
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

    await fetchData(
      "https://kosconnect-server.vercel.app/api/facility/type?type=room",
      document.getElementById("roomFacilities"),
      "facility_id",
      "name",
      "roomFacilities[]",
      roomData.room_facilities
    );
    await fetchCustomFacilities(
      "https://kosconnect-server.vercel.app/api/customFacilities/owner",
      document.getElementById("customFacilities"),
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

    const fasilitasKos = Array.from(
      document.querySelectorAll("input[name='roomFacilities[]']:checked")
    ).map((opt) => opt.value);
    const customFacilities = Array.from(
      document.querySelectorAll("input[name='customFacilities[]']:checked")
    ).map((opt) => opt.value);

    console.log("Room Facilities:", fasilitasKos);
    console.log("Custom Facilities:", customFacilities);

    const formData = new FormData();
    formData.append("room_type", document.getElementById("roomType").value);
    formData.append("size", document.getElementById("size").value);
    formData.append(
      "number_available",
      document.getElementById("numberAvailable").value
    );
    formData.append(
      "price_monthly",
      document.getElementById("hargaKamar1").value
    );
    formData.append(
      "price_quarterly",
      document.getElementById("hargaKamar2").value
    );
    formData.append(
      "price_semi_annual",
      document.getElementById("hargaKamar3").value
    );
    formData.append(
      "price_yearly",
      document.getElementById("hargaKamar4").value
    );
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
