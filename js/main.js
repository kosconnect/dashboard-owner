// Fungsi untuk mengambil nilai cookie berdasarkan nama
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Fungsi untuk mengambil data dari API Total Kos
async function getTotalKos() {
  try {
    const token = getCookie("authToken"); // Ambil token dari cookie
    const kosResponse = await fetch(
      "https://kosconnect-server.vercel.app/api/boardingHouses/owner",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Menambahkan token pada header
        },
      }
    );
    const kosData = await kosResponse.json();

    // Tampilkan jumlah kos pada widget
    document.getElementById("total-kos").innerText = kosData.length; // Jumlah data kos
  } catch (error) {
    console.error("Error fetching kos data:", error);
  }
}

// Fungsi untuk mengambil data dari API Total Kamar
async function getTotalKamar() {
  try {
    const token = getCookie("authToken"); // Ambil token dari cookie
    const boardingHouseResponse = await fetch(
      "https://kosconnect-server.vercel.app/api/boardingHouses/owner",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Menambahkan token pada header
        },
      }
    );
    const boardingHouseData = await boardingHouseResponse.json();

    let totalRooms = 0;

    for (const boardingHouse of boardingHouseData) {
      const boardingHouseId = boardingHouse.id;

      // Ambil data kamar kos berdasarkan boardingHouseId
      const roomsResponse = await fetch(
        `https://kosconnect-server.vercel.app/api/rooms/boarding-house/${boardingHouseId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Menambahkan token pada header
          },
        }
      );
      const roomsData = await roomsResponse.json();

      totalRooms += roomsData.length; // Menjumlahkan total kamar dari semua boarding house
    }

    // Tampilkan jumlah kamar kos pada widget
    document.getElementById("total-kamar").innerText = totalRooms;
  } catch (error) {
    console.error("Error fetching rooms data:", error);
  }
}

// Fungsi untuk mendapatkan total transaksi dengan status settlement
async function getTotalTransaksi() {
  try {
    const token = getCookie("authToken"); // Ambil token dari cookie
    const transaksiResponse = await fetch(
      "https://kosconnect-server.vercel.app/api/transaction/owner",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Menambahkan token pada header
        },
      }
    );
    const transaksiData = await transaksiResponse.json();

    // Filter transaksi dengan status settlement
    const settlementTransactions = transaksiData.filter(
      (transaction) => transaction.payment_status === "settlement"
    );

    // Tampilkan total transaksi settlement
    document.getElementById("total-transaksi").innerText =
      settlementTransactions.length;
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

// Panggil fungsi untuk mendapatkan total kos
getTotalKos();

// Panggil fungsi untuk mendapatkan total kamar kos
getTotalKamar();

// Panggil fungsi untuk mendapatkan total transaksi dengan status settlement
getTotalTransaksi();