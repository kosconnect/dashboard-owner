// Fungsi untuk membaca nilai cookie berdasarkan nama
function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Variabel global untuk menyimpan semua data orders
let allOrderData = [];

// Fungsi untuk merender tabel transaksi
async function renderOrderTable(orders) {
    const tbody = document.querySelector("table tbody");

    // Bersihkan konten tabel sebelumnya
    tbody.innerHTML = "";

    if (orders.length === 0) {
        tbody.innerHTML = `
        <tr>
          <td colspan="6">Tidak ada transaksi yang ditemukan.</td>
        </tr>
      `;
        return;
    }

    // Tambahkan baris untuk setiap transaksi
    for (const order of orders.data) {
        // Ambil detail room type langsung dari endpoint
        const roomResponse = await fetch(
            `https://kosconnect-server.vercel.app/api/rooms/${order.room_id}/pages`
        );

        if (!roomResponse.ok) {
            console.error(`Error fetching room detail for room_id ${order.room_id}`);
            continue; // Lewati jika detail room tidak ditemukan
        }

        const roomDetail = await roomResponse.json();

        // Ambil room_type dari roomDetail
        const roomName = roomDetail && roomDetail[0] ? roomDetail[0].room_name : "Tidak Diketahui";

        // Ambil full_name dari personal_info
        const fullName = order.personal_info?.full_name || "Tidak Diketahui"; // default jika tidak ada personal_info atau full_name

        const paymentStatusMap = {
            pending: "Menunggu",
            settlement: "Lunas",
            expire: "Kadaluarsa",
            deny: "Ditolak atau Gagal",
          };
      
          const paymentStatus =
            paymentStatusMap[order.payment_status] || "Tidak Diketahui";

        const totalFormatted = `Rp ${order.total.toLocaleString("id-ID")}`;
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${orders.data.indexOf(order) + 1}</td>
        <td>${order.transaction_code}</td>
        <td>${fullName}</td>
        <td>${roomName}</td> <!-- Tampilkan room_type di sini -->
        <td>${paymentStatus}</td>
        <td>${totalFormatted}</td>
        <td>
        <a href="invoice.html?transaction_id=${order.transaction_id}" class="btn btn-primary" style="text-decoration: none;">
            <i class="fas fa-info-circle"></i> Detail
        </a>
        </td>
        `;

        tbody.appendChild(row);
    }
}

// Ambil data transaksi saat halaman dimuat
window.onload = async () => {
    try {
        const authToken = getCookie("authToken");
        const response = await fetch(
            `https://kosconnect-server.vercel.app/api/transaction/owner`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil data transaksi");
        }

        allOrderData = await response.json();
        await renderOrderTable(allOrderData);
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
};

// console.log(order.personal_info);