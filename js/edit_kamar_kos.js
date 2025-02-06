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

async function fetchRoomDetails() {
  if (!roomId || !token) {
    console.error("Room ID atau token tidak ditemukan.");
    return;
  }

  try {
    const response = await fetch(
      `https://kosconnect-server.vercel.app/api/rooms/${roomId}/detail`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) throw new Error("Gagal mengambil data kamar");

    const [data] = await response.json();
    document.getElementById("tipeKamar").value = data.room_type || "";
    document.getElementById("ukuranKamar").value = data.size || "";
    document.getElementById("kamarTersedia").value =
      data.number_available || "";
    document.getElementById("boardingHouseName").textContent =
      data.boarding_house_name || "";

    boardingHouseId = data.boarding_house_id;

    await fetchData(
      "https://kosconnect-server.vercel.app/api/facility/type?type=room",
      document.getElementById("fasilitasKamar"),
      "facility_id",
      "name",
      data.room_facilities,
      true
    );

    await fetchCustomFacilities(data.custom_facility_details.map((f) => f._id));
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchData(
  url,
  containerElement,
  keyId,
  keyName,
  selectedItems = [],
  isCheckbox = false
) {
  if (!token) return;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Gagal mengambil data");

    const { data } = await response.json();
    if (!Array.isArray(data)) throw new Error("Format data tidak sesuai");

    containerElement.innerHTML = isCheckbox
      ? ""
      : `<option value="">Pilih</option>`;

    data.forEach((item) => {
      if (isCheckbox) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "roomFacilities[]";
        checkbox.value = item[keyId];
        checkbox.id = `facility_${item[keyId]}`;
        if (selectedItems.includes(item[keyId])) checkbox.checked = true;

        const label = document.createElement("label");
        label.setAttribute("for", checkbox.id);
        label.textContent = item[keyName];

        const wrapper = document.createElement("div");
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        containerElement.appendChild(wrapper);
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

async function fetchCustomFacilities(selectedFacilities = []) {
  if (!token) return;

  try {
    const response = await fetch(
      "https://kosconnect-server.vercel.app/api/customFacilities/owner",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) throw new Error("Gagal mengambil fasilitas tambahan");

    const { data } = await response.json();
    const container = document.getElementById("fasilitasTambahan");
    container.innerHTML = "";

    data.forEach((item) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "fasilitasTambahan[]";
      checkbox.value = item.custom_facility_id;
      checkbox.id = `custom_${item.custom_facility_id}`;
      if (selectedFacilities.includes(item.custom_facility_id))
        checkbox.checked = true;

      const label = document.createElement("label");
      label.setAttribute("for", checkbox.id);
      label.textContent = item.name;

      const wrapper = document.createElement("div");
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchRoomDetails);

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