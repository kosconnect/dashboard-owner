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

async function fetchCustomFacilities(selectedFacilities = []) {
    if (!token) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    const fasilitasTambahanContainer = document.getElementById("fasilitasTambahan");

    try {
        const response = await fetch("https://kosconnect-server.vercel.app/api/customFacilities/owner", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil fasilitas tambahan");

        const data = await response.json();
        const listData = data.data || data;

        if (!Array.isArray(listData)) {
            throw new Error("Format data tidak sesuai");
        }

        fasilitasTambahanContainer.innerHTML = "";

        listData.forEach(item => {
            const checkboxWrapper = document.createElement("div");
            const checkboxInput = document.createElement("input");
            checkboxInput.type = "checkbox";
            checkboxInput.name = "fasilitasTambahan[]";
            checkboxInput.value = item.custom_facility_id;
            checkboxInput.id = `fasilitasTambahan_${item.custom_facility_id}`;

            if (selectedFacilities.includes(item.custom_facility_id)) {
                checkboxInput.checked = true;
            }

            const checkboxLabel = document.createElement("label");
            checkboxLabel.setAttribute("for", checkboxInput.id);
            checkboxLabel.textContent = item.name;

            checkboxWrapper.appendChild(checkboxInput);
            checkboxWrapper.appendChild(checkboxLabel);
            fasilitasTambahanContainer.appendChild(checkboxWrapper);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

async function fetchRoomById() {
    if (!roomId) {
        console.error("Room ID tidak ditemukan.");
        return;
    }

    try {
        const response = await fetch(`https://kosconnect-server.vercel.app/api/rooms/${roomId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil data kamar");

        const data = await response.json();
        document.getElementById("tipeKamar").value = data.room_type;
        document.getElementById("ukuranKamar").value = data.size;
        document.getElementById("kamarTersedia").value = data.number_available;

        await fetchCustomFacilities(data.custom_facilities);
    } catch (error) {
        console.error("Error:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchRoomById();
});

document.getElementById("formEditRoom").addEventListener("submit", async function (e) {
    e.preventDefault();

    const tipeKamar = document.getElementById("tipeKamar").value;
    const ukuranKamar = document.getElementById("ukuranKamar").value;
    const hargaInputs = Array.from(document.querySelectorAll(".hargaKamar")).map(input => input.value);
    const kamarTersedia = document.getElementById("kamarTersedia").value;

    const roomFacilities = Array.from(document.querySelectorAll("input[name='roomFacilities[]']:checked"))
        .map(opt => opt.value);
    
    const fasilitasTambahan = Array.from(document.querySelectorAll("input[name='fasilitasTambahan[]']:checked"))
        .map(opt => opt.value);

    const imagesInput = document.getElementById("images"); // Ambil elemen input gambar
    const files = imagesInput.files; // Ambil file yang diunggah

    if (hargaInputs.every(harga => harga.trim() === "")) {
        alert("Minimal satu harga harus diisi");
        return;
    }

    const formData = new FormData();
    formData.append("room_type", tipeKamar);
    formData.append("size", ukuranKamar);
    formData.append("price_monthly", hargaInputs[0] || "0");
    formData.append("price_quarterly", hargaInputs[1] || "0");
    formData.append("price_semi_annual", hargaInputs[2] || "0");
    formData.append("price_yearly", hargaInputs[3] || "0");
    formData.append("number_available", kamarTersedia);
    formData.append("room_facilities", JSON.stringify(roomFacilities));
    formData.append("custom_facilities", JSON.stringify(fasilitasTambahan));

    // Tambahkan gambar ke dalam FormData
    for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
    }

    try {
        const response = await fetch(`https://kosconnect-server.vercel.app/api/rooms/${roomId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}` // Perlu tanpa "Content-Type" karena FormData
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Gagal memperbarui data kamar");
        }

        alert("Kamar berhasil diperbarui!");
        window.location.href = "manajemen_kamar.html";
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat memperbarui kamar.");
    }
});
