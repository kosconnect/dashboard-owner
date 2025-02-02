// Fungsi untuk membaca boarding_house_id dari URL
function getBoardingHouseIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("boarding_house_id");
}

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

// Ambil token dari cookie
const token = getJwtToken();

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
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil data");

        const data = await response.json();
        const listData = data.data || data;

        if (!Array.isArray(listData)) {
            throw new Error("Format data tidak sesuai");
        }

        containerElement.innerHTML = "";

        listData.forEach(item => {
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

// Fungsi untuk fetch fasilitas umum
async function fetchFacilities() {
    if (!token) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    const fasilitasKamarContainer = document.getElementById("fasilitasKamar");
    const fasilitasTambahanContainer = document.getElementById("fasilitasTambahan");

    // Fetch fasilitas umum tanpa owner_id
    fetchData("https://kosconnect-server.vercel.app/api/facility/type?type=room", fasilitasKamarContainer, "facility_id", "name");

    // Fetch fasilitas tambahan tanpa owner_id
    fetchData("https://kosconnect-server.vercel.app/api/customFacilities/owner", fasilitasTambahanContainer, "facility_id", "name");
}

// Panggil fungsi untuk mengisi fasilitas saat halaman dimuat
document.addEventListener("DOMContentLoaded", fetchFacilities);

// Fungsi untuk menangani submit form
document.getElementById("formTambahKamar").addEventListener("submit", async function (e) {
    e.preventDefault();

    const boardingHouseId = getBoardingHouseIdFromURL();
    if (!boardingHouseId) {
        alert("Boarding House ID tidak ditemukan di URL.");
        return;
    }

    const tipeKamar = document.getElementById("tipeKamar").value;
    const ukuranKamar = document.getElementById("ukuranKamar").value;
    const hargaKamar = Array.from(document.querySelectorAll(".hargaKamar"))
        .map(input => input.value.trim())
        .filter(harga => harga !== "" && !isNaN(harga))
        .map(Number);

    const kamarTersedia = document.getElementById("kamarTersedia").value;
    const fasilitasKamar = Array.from(document.querySelectorAll("input[name='fasilitasKamar[]']:checked")).map(opt => opt.value);
    const fasilitasTambahan = Array.from(document.querySelectorAll("input[name='fasilitasTambahan[]']:checked"))
        .map(opt => opt.value)
        .filter(value => value !== "undefined" && value !== "");

    const imageInputs = document.querySelectorAll("input[name='imagesKamar[]']");

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

    formData.append("type", tipeKamar);
    formData.append("size", ukuranKamar);
    formData.append("price", JSON.stringify(hargaKamar));
    formData.append("available_rooms", kamarTersedia);
    formData.append("facilities", JSON.stringify(fasilitasKamar));
    formData.append("additional_facilities", JSON.stringify(fasilitasTambahan));

    console.log("Data yang dikirim:", Object.fromEntries(formData.entries()));

    try {
        const response = await fetch(`https://kosconnect-server.vercel.app/api/rooms/${boardingHouseId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const responseText = await response.text();
        console.log("Server Response:", responseText);

        if (!response.ok) throw new Error("Gagal menyimpan data");

        alert("Kamar berhasil ditambahkan!");
        window.location.href = "manajemen_kamar_kos.html";
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat menambahkan kamar.");
    }
});
