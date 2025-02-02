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

// Fungsi untuk mendapatkan role dan user_id dari JWT
function getUserRoleAndId() {
    if (!token) return { role: null, userId: null };

    try {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode payload JWT
        return {
            role: payload.role || null,
            userId: payload.user_id || null
        };
    } catch (error) {
        console.error("Gagal mendekode JWT:", error);
        return { role: null, userId: null };
    }
}

const { role, userId } = getUserRoleAndId();

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

// Panggil fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", async () => {
    const categoryKosContainer = document.getElementById("categoryKos");
    const fasilitasKosContainer = document.getElementById("fasilitasKos");

    // Fetch data untuk kategori dan fasilitas
    fetchData("https://kosconnect-server.vercel.app/api/categories/", categoryKosContainer, "category_id", "name");
    fetchData("https://kosconnect-server.vercel.app/api/facility/type?type=boarding_house", fasilitasKosContainer, "facility_id", "name", true);
});

// Fungsi untuk menangani submit form
document.getElementById("formTambahKos").addEventListener("submit", async function (e) {
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

    if (imageCount < 1) {
        alert("Minimal satu gambar kos harus diunggah!");
        return;
    }

    if (imageCount > 5) {
        alert("Anda hanya bisa mengunggah maksimal 5 gambar.");
        return;
    }

    // Tambahkan data form
    formData.append("category_id", categoryKos);
    formData.append("name", namaKos);
    formData.append("address", alamatKos);
    formData.append("description", descriptionKos);
    formData.append("rules", rulesKos);
    formData.append("facilities", JSON.stringify(fasilitasKos));

    // Jika role admin, tambahkan owner_id
    // if (role === "admin") {
    //     const ownerIdInput = document.getElementById("ownerId");
    //     if (!ownerIdInput || !ownerIdInput.value) {
    //         alert("Owner ID harus diisi oleh admin.");
    //         return;
    //     }
    //     formData.append("owner_id", ownerIdInput.value);
    // } else if (role === "owner") {
    //     formData.append("owner_id", userId);
    // } else {
    //     console.error("Role tidak valid!");
    //     alert("Anda tidak memiliki izin untuk membuat kos.");
    //     return;
    // }

    console.log("Data yang dikirim:", Object.fromEntries(formData.entries()));

    try {
        const response = await fetch("https://kosconnect-server.vercel.app/api/boardingHouses/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Gagal menyimpan data");
        }

        alert("Kos berhasil ditambahkan!");
        window.location.href = "manajemen_kos.html"; // Redirect setelah sukses
    } catch (error) {
        console.error("Error:", error);
        alert(`Terjadi kesalahan: ${error.message}`);
    }
});
