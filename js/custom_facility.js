// Fetch JWT Token from Cookies
function getJwtToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('authToken=')) {
            return cookie.substring('authToken='.length);
        }
    }
    console.error("Token tidak ditemukan.");
    return null;
}

// GET Custom Facilities and Populate Table
function fetchCustomFacilities() {
    const jwtToken = getJwtToken();
    if (!jwtToken) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    fetch('https://kosconnect-server.vercel.app/api/customFacilities/owner', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log(response);  // Tambahkan ini
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Data fasilitas khusus:", data);

            const tbody = document.querySelector('table tbody');
            if (!tbody) {
                console.error("Elemen tbody tidak ditemukan di DOM.");
                return;
            }

            // Kosongkan tabel sebelum menambah data baru
            tbody.innerHTML = '';

            // Loop data dan tambahkan ke tabel
            data.forEach((fasilitas, index) => {
                const tr = document.createElement('tr');

                // Simpan ID fasilitas di atribut data-id
                tr.setAttribute('data-id', fasilitas.custom_facility_id);

                // Kolom No
                const tdNo = document.createElement('td');
                tdNo.textContent = index + 1;
                tr.appendChild(tdNo);

                // Kolom Nama Fasilitas
                const tdNama = document.createElement('td');
                tdNama.textContent = fasilitas.name || 'N/A';
                tr.appendChild(tdNama);

                // Kolom Harga
                const tdHarga = document.createElement('td');
                tdHarga.textContent = fasilitas.price ? `Rp ${fasilitas.price.toLocaleString('id-ID')}` : 'N/A';
                tr.appendChild(tdHarga);

                // Kolom Owner ID
                // const tdOwnerId = document.createElement('td');
                // tdOwnerId.textContent = fasilitas.owner_id;  // Pastikan 'owner_id' sesuai dengan struktur data API
                // tr.appendChild(tdOwnerId);

                // Kolom Aksi
                const tdAksi = document.createElement('td');
                tdAksi.innerHTML = `
                    <button class="btn btn-primary edit-btn" data-id="${fasilitas.custom_facility_id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-primary" onclick="deleteCustomFacility('${fasilitas.custom_facility_id}')"><i class="fas fa-trash"></i> Hapus</button>
                `;
                tr.appendChild(tdAksi);

                // Tambahkan baris ke tabel
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error("Gagal mengambil data fasilitas khusus:", error);
        });
}

// Panggil fungsi fetch ketika halaman dimuat
document.addEventListener('DOMContentLoaded', fetchCustomFacilities);

document.addEventListener("DOMContentLoaded", function () {
    window.openPopup = function () {
        document.getElementById("popupTambahFasilitasCustom").style.display = "block";
    }

    window.closePopup = function () {
        document.getElementById("popupTambahFasilitasCustom").style.display = "none";
    }
});


// POST Custom Facility
// Fungsi untuk menangani pengiriman form
document.getElementById("formTambahFasilitasCustom").addEventListener("submit", function (event) {
    event.preventDefault();  // Mencegah form dari pengiriman default

    // Ambil data dari form
    const namaFasilitas = document.getElementById("namaFasilitasCustom").value;
    const hargaFasilitas = document.getElementById("hargaFasilitas").value;

    // Ambil token JWT dari cookies
    const jwtToken = getJwtToken();
    if (!jwtToken) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    // Membuat data yang akan dikirim
    const data = {
        name: namaFasilitas,
        price: parseFloat(hargaFasilitas)  // Pastikan harga dalam bentuk angka
    };

    // Kirim data menggunakan fetch (POST)
    fetch('https://kosconnect-server.vercel.app/api/customFacilities/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)  // Mengirim data dalam format JSON
    })
        .then(response => {
            console.log(response);  // Untuk debug response dari server
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();  // Mengambil response dalam format JSON
        })
        .then(data => {
            console.log("Fasilitas custom berhasil ditambahkan:", data);

            // Menampilkan alert sukses
            alert("Fasilitas custom berhasil ditambahkan!");

            // Kosongkan form setelah berhasil menambah data
            document.getElementById("namaFasilitasCustom").value = '';
            document.getElementById("hargaFasilitas").value = '';

            // Tutup popup setelah berhasil
            closePopup();

            // Refresh data fasilitas custom
            fetchCustomFacilities();
        })
        .catch(error => {
            console.error("Gagal menambah fasilitas custom:", error);

            // Menampilkan alert gagal
            alert("Gagal menambah fasilitas custom. Coba lagi.");
        });
});

function closePopup() {
    document.getElementById("popupTambahFasilitasCustom").style.display = "none";
    document.getElementById("formTambahFasilitasCustom").reset();
}


// Handle Edit Button Click
document.addEventListener("click", function (event) {
    if (event.target.closest(".edit-btn")) {
        const custom_facility_id = event.target.closest(".edit-btn").dataset.id;
        openEditPopup(custom_facility_id);
    }
});

// PUT Custom Facility
function openEditPopup(custom_facility_id) {
    const jwtToken = getJwtToken();
    if (!jwtToken) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    fetch(`https://kosconnect-server.vercel.app/api/customFacilities/${custom_facility_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("namaFasilitasEdit").value = data.name;
            document.getElementById("hargaFasilitasEdit").value = data.price;
            document.getElementById("popupEditFasilitasCustom").style.display = "block";
            document.getElementById("formEditFasilitasCustom").setAttribute('data-id', custom_facility_id);
        })
        .catch(error => {
            console.error("Gagal mengambil data fasilitas:", error);
            alert("Gagal mengambil data fasilitas. Coba lagi.");
        });
}

document.getElementById("formEditFasilitasCustom").addEventListener("submit", function (event) {
    event.preventDefault();

    const namaFasilitas = document.getElementById("namaFasilitasEdit").value;
    const hargaFasilitas = document.getElementById("hargaFasilitasEdit").value;

    const jwtToken = getJwtToken();
    if (!jwtToken) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    const custom_facility_id = document.getElementById("formEditFasilitasCustom").getAttribute('data-id');
    const data = {
        name: namaFasilitas,
        price: parseFloat(hargaFasilitas)
    };

    fetch(`https://kosconnect-server.vercel.app/api/customFacilities/${custom_facility_id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert("Fasilitas custom berhasil diperbarui!");
            closeEditPopup();
            fetchCustomFacilities();
        })
        .catch(error => {
            console.error("Gagal memperbarui fasilitas custom:", error);
            alert("Gagal memperbarui fasilitas custom. Coba lagi.");
        });
});

function closeEditPopup() {
    document.getElementById("popupEditFasilitasCustom").style.display = "none";
    document.getElementById("formEditFasilitasCustom").reset();
}


// DELETE Custom Facility
function deleteCustomFacility(custom_facility_id) {
    const jwtToken = getJwtToken();
    if (!jwtToken) {
        console.error("Tidak ada token JWT, tidak dapat melanjutkan permintaan.");
        return;
    }

    const confirmation = confirm("Apakah Anda yakin ingin menghapus fasilitas ini?");
    if (!confirmation) {
        return;
    }

    fetch(`https://kosconnect-server.vercel.app/api/customFacilities/${custom_facility_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fasilitas custom berhasil dihapus:", data);
            alert("Fasilitas custom berhasil dihapus!");
            fetchCustomFacilities();
        })
        .catch(error => {
            console.error("Gagal menghapus fasilitas custom:", error);
            alert("Gagal menghapus fasilitas custom. Coba lagi.");
        });
}