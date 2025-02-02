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
const urlParams = new URLSearchParams(window.location.search);
const boardingHouseId = urlParams.get("boarding_house_id"); // Sesuai dengan boarding_house_id dari URL

// Fungsi untuk fetch data dan isi dropdown atau checkbox
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
                checkboxInput.name = "fasilitasKos[]";
                checkboxInput.value = item[keyId];
                checkboxInput.id = `fasilitas_${item[keyId]}`;

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

// Fungsi untuk mengambil data kos berdasarkan ID dan mengisi form
async function fetchBoardingHouseById() {
    if (!boardingHouseId) {
        console.error("ID kos tidak ditemukan.");
        return;
    }

    try {
        const response = await fetch(`https://kosconnect-server.vercel.app/api/boardingHouses/${boardingHouseId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil data kos");

        const data = await response.json();

        console.log("Data Kos:", data); // Tambahkan log untuk melihat data

        // Mengisi form dengan data yang diambil
        document.getElementById("categoryKos").value = data.boardingHouse.category_id || '';
        document.getElementById("namaKos").value = data.boardingHouse.name || '';
        document.getElementById("alamatKos").value = data.boardingHouse.address || '';
        document.getElementById("descriptionKos").value = data.boardingHouse.description || '';
        document.getElementById("rulesKos").value = data.boardingHouse.rules || '';

        // Menambahkan gambar yang sudah ada, jika ada
        const imageContainer = document.querySelector(".image-inputs");
        if (Array.isArray(data.boardingHouse.images) && data.boardingHouse.images.length > 0) {
            data.boardingHouse.images.forEach((image, index) => {
                const imageElement = document.createElement("img");
                imageElement.src = image;
                imageElement.alt = `Gambar ${index + 1}`;
                imageElement.style.width = "100px"; // Gaya gambar jika perlu
                imageContainer.appendChild(imageElement);
            });
        }

        // Menambahkan fasilitas yang sesuai, jika ada
        if (Array.isArray(data.boardingHouse.facilities_id) && data.boardingHouse.facilities_id.length > 0) {
            const selectedFacilities = new Set(data.boardingHouse.facilities_id);
            document.querySelectorAll("input[name='fasilitasKos[]']").forEach(input => {
                if (selectedFacilities.has(input.value)) {
                    input.checked = true;
                }
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

// Panggil fungsi untuk mengisi dropdown dan checkbox, lalu ambil data kos
document.addEventListener("DOMContentLoaded", async () => {
    const categoryKosContainer = document.getElementById("categoryKos");
    const fasilitasKosContainer = document.getElementById("fasilitasKos");

    // Fetch kategori dan fasilitas dulu
    await fetchData("https://kosconnect-server.vercel.app/api/categories/", categoryKosContainer, "category_id", "name");
    await fetchData("https://kosconnect-server.vercel.app/api/facility/type?type=boarding_house", fasilitasKosContainer, "facility_id", "name", true);

    // Setelah kategori & fasilitas terisi, baru ambil data kos berdasarkan ID
    await fetchBoardingHouseById();
});

// Fungsi untuk menangani submit form (PUT request)
document.getElementById("formEditKos").addEventListener("submit", async function (e) {
    e.preventDefault();

    const categoryKos = document.getElementById("categoryKos").value;
    const namaKos = document.getElementById("namaKos").value;
    const alamatKos = document.getElementById("alamatKos").value;
    const descriptionKos = document.getElementById("descriptionKos").value;
    const rulesKos = document.getElementById("rulesKos").value;

    const fasilitasKos = Array.from(document.querySelectorAll("input[name='fasilitasKos[]']:checked")).map(opt => opt.value);

    const imageInputs = document.querySelectorAll("input[name='imagesKos[]']");

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

    formData.append("boarding_house_id", boardingHouseId); // Menggunakan boarding_house_id
    formData.append("category_id", categoryKos);
    formData.append("name", namaKos);
    formData.append("address", alamatKos);
    formData.append("description", descriptionKos);
    formData.append("rules", rulesKos);
    formData.append("facilities", JSON.stringify(fasilitasKos));

    try {
        const response = await fetch(`https://kosconnect-server.vercel.app/api/boardingHouses/${boardingHouseId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error("Gagal memperbarui data");

        alert("Kos berhasil diperbarui!");
        window.location.href = "manajemen_kos.html";
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat memperbarui kos.");
    }
});