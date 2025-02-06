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

    // Periksa apakah kosData.data adalah array
    if (Array.isArray(kosData.data)) {
      // Tampilkan jumlah kos pada widget
      document.getElementById("total-kos").innerText = kosData.data.length; // Jumlah data kos
    } else {
      console.error("Data kos tidak dalam format array", kosData);
    }
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

    // Debug: Cek apakah boardingHouseData ada dan valid
    console.log("boardingHouseData:", boardingHouseData);

    // Periksa apakah boardingHouseData.data adalah array dan tidak kosong
    if (
      Array.isArray(boardingHouseData.data) &&
      boardingHouseData.data.length > 0
    ) {
      let totalRooms = 0;

      for (const boardingHouse of boardingHouseData.data) {
        const boardingHouseId = boardingHouse.boarding_house_id; // Gunakan boarding_house_id

        // Debug: Cek boardingHouseId
        console.log("boardingHouseId:", boardingHouseId);

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

        // Debug: Cek roomsData
        console.log("roomsData:", roomsData);

        // Periksa apakah roomsData.data adalah array
        if (Array.isArray(roomsData.data)) {
          totalRooms += roomsData.data.length; // Menjumlahkan total kamar dari semua boarding house
        } else {
          console.error("Data rooms tidak dalam format array", roomsData);
        }
      }

      // Tampilkan jumlah kamar kos pada widget
      document.getElementById("total-kamar").innerText = totalRooms;
    } else {
      console.error(
        "Data boardingHouse tidak dalam format array atau kosong",
        boardingHouseData
      );
    }
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

    // Periksa apakah transaksiData.data adalah array
    if (Array.isArray(transaksiData.data)) {
      // Filter transaksi dengan status settlement
      const settlementTransactions = transaksiData.data.filter(
        (transaction) => transaction.payment_status === "settlement"
      );

      // Tampilkan total transaksi settlement
      document.getElementById("total-transaksi").innerText =
        settlementTransactions.length;
    } else {
      console.error("Data transaksi tidak dalam format array", transaksiData);
    }
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