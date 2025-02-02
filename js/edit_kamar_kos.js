// Fungsi untuk mendapatkan JWT token dari cookie
function getJwtToken() {
    const cookies = document.cookie.split('; ');
    for (let cookie of cookies) {
        const [key, value] = cookie.split('=');
        if (key === 'authToken') {
            return decodeURIComponent(value);
        }
    }
    console.error("Token tidak ditemukan.");
    return null;
}

const token = getJwtToken();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room_id");

async function fetchData(url, containerElement, keyId, keyName, isCheckbox = false) {
    if (!token) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil data");

        const data = await response.json();
        const listData = data.data || data;

        if (!Array.isArray(listData)) {
            throw new Error("Format data tidak sesuai");
        }

        containerElement.innerHTML = isCheckbox ? "" : `<option value="">Pilih</option>`;

        listData.forEach(item => {
            if (isCheckbox) {
                const checkboxWrapper = document.createElement("div");
                const checkboxInput = document.createElement("input");
                checkboxInput.type = "checkbox";
                checkboxInput.name = "roomFacilities[]";
                checkboxInput.value = item[keyId];
                checkboxInput.id = `facility_${item[keyId]}`;

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

// Fungsi untuk mengambil fasilitas tambahan (custom facility)
async function fetchCustomFacilities() {
    if (!token) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    const customFacilitiesContainer = document.getElementById("fasilitasTambahan");
    if (!customFacilitiesContainer) {
        console.error("Element #fasilitasTambahan tidak ditemukan!");
        return;
    }

    try {
        const response = await fetch("https://kosconnect-server.vercel.app/api/customFacilities/owner", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil data custom facility");

        const data = await response.json();
        const listData = data.data || data;

        if (!Array.isArray(listData)) {
            throw new Error("Format data tidak sesuai");
        }

        customFacilitiesContainer.innerHTML = "";

        listData.forEach(item => {
            const checkboxWrapper = document.createElement("div");
            const checkboxInput = document.createElement("input");
            checkboxInput.type = "checkbox";
            checkboxInput.name = "fasilitasTambahan[]";
            checkboxInput.value = item.facility_id;
            checkboxInput.id = `custom_facility_${item.facility_id}`;

            const checkboxLabel = document.createElement("label");
            checkboxLabel.setAttribute("for", checkboxInput.id);
            checkboxLabel.textContent = item.name;

            checkboxWrapper.appendChild(checkboxInput);
            checkboxWrapper.appendChild(checkboxLabel);
            customFacilitiesContainer.appendChild(checkboxWrapper);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}


async function fetchRoomById() {
    if (!roomId) {
        console.error("ID kamar tidak ditemukan.");
        return;
    }

    try {
        const response = await fetch(`https://kosconnect-server.vercel.app/api/rooms/${roomId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil data kamar");

        const data = await response.json();

        document.getElementById("size").value = data.data.size || '';
        document.getElementById("priceMonthly").value = data.data.price?.monthly || '';
        document.getElementById("priceQuarterly").value = data.data.price?.quarterly || '';
        document.getElementById("priceSemiAnnual").value = data.data.price?.semi_annual || '';
        document.getElementById("priceYearly").value = data.data.price?.yearly || '';
        document.getElementById("numberAvailable").value = data.data.number_available || '';

        // Set fasilitas kamar yang sudah dipilih sebelumnya
        if (Array.isArray(data.data.room_facilities) && data.data.room_facilities.length > 0) {
            const selectedFacilities = new Set(data.data.room_facilities);
            document.querySelectorAll("input[name='roomFacilities[]']").forEach(input => {
                if (selectedFacilities.has(input.value)) {
                    input.checked = true;
                }
            });
        }

        // Set fasilitas tambahan yang sudah dipilih sebelumnya
        if (Array.isArray(data.data.custom_facilities) && data.data.custom_facilities.length > 0) {
            const selectedCustomFacilities = new Set(data.data.custom_facilities);
            document.querySelectorAll("input[name='fasilitasTambahan[]']").forEach(input => {
                if (selectedCustomFacilities.has(input.value)) {
                    input.checked = true;
                }
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    const facilitiesContainer = document.getElementById("fasilitasKamar");
    if (!facilitiesContainer) {
        console.error("Element #fasilitasKamar tidak ditemukan!");
        return;
    }
    await fetchData("https://kosconnect-server.vercel.app/api/facility/type?type=room", facilitiesContainer, "facility_id", "name", true);
    await fetchRoomById();
});

document.getElementById("formEditRoom").addEventListener("submit", async function (e) {
    e.preventDefault();

    const tipeKamar = document.getElementById("tipeKamar").value;
    const ukuranKamar = document.getElementById("ukuranKamar").value;
    const hargaInputs = Array.from(document.querySelectorAll(".hargaKamar")).map(input => input.value);
    const kamarTersedia = document.getElementById("kamarTersedia").value;

    const roomFacilities = Array.from(document.querySelectorAll("input[name='roomFacilities[]']:checked")).map(opt => opt.value);
    const fasilitasTambahan = Array.from(document.querySelectorAll("input[name='fasilitasTambahan[]']:checked"))
        .map(opt => opt.value)
        .filter(value => value !== "undefined" && value !== "");

    if (hargaInputs.every(harga => harga.trim() === "")) {
        alert("Minimal satu harga harus diisi");
        return;
    }

    const formData = new FormData();
    formData.append("room_type", tipeKamar);
    formData.append("size", ukuranKamar);
    formData.append("price_monthly", hargaInputs[0] || '');
    formData.append("price_quarterly", hargaInputs[1] || '');
    formData.append("price_semi_annual", hargaInputs[2] || '');
    formData.append("price_yearly", hargaInputs[3] || '');
    formData.append("number_available", kamarTersedia);
    formData.append("room_facilities", JSON.stringify(roomFacilities));
    formData.append("custom_facilities", JSON.stringify(fasilitasTambahan));

    try {
        const response = await fetch(`https://kosconnect-server.vercel.app/api/rooms/${roomId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error("Gagal memperbarui data kamar");

        alert("Kamar berhasil diperbarui!");
        window.location.href = "manajemen_kamar.html";
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat memperbarui kamar.");
    }
});
