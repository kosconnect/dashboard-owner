function toggleDropdown() {
  const dropdown = document.querySelector(".dropdown-menu");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

// Buat function ini bisa diakses dari HTML
window.toggleDropdown = toggleDropdown;

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

document.addEventListener("DOMContentLoaded", () => {
  loadSidebar();
  loadHeader();

  const authToken = getCookie("authToken");
  const userRole = getCookie("userRole");

  setTimeout(() => {
    const userNameElement = document.querySelector(".user-dropdown .name");
    if (authToken) {
      fetch("https://kosconnect-server.vercel.app/api/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch user data");
          return response.json();
        })
        .then((data) => {
          const user = data.user;
          const userName =
            user?.fullname || userRole || "Pemilik Kos Tidak Diketahui";
          if (userNameElement) userNameElement.textContent = userName;
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          if (userNameElement)
            userNameElement.textContent = userRole || "Guest";
        });
    } else {
      if (userNameElement) userNameElement.textContent = "Guest";
    }
  }, 300);

  const logoutBtn = document.querySelector(".dropdown-menu li a");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      document.cookie =
        "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure";
      document.cookie =
        "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure";
      window.location.href = "https://kosconnect.github.io/login/";
    });
  }
});

function loadSidebar() {
  const sidebarHTML = `
        <div class="sidebar">
            <div class="sidebar-header">
                <img src="img/logokos.png" alt="Kosconnect Logo" style="width: 40px; height: 40px; margin-right: 10px;">
                <h2>KosConnect</h2>
            </div>
            <ul>
                <li><a href="index.html"><i class="fas fa-tachometer-alt"></i> <span>Dasbor</span></a></li>
                <li>
                    <h2 style="font-size: 14px; color: #b0bec5;">Manajemen Data Kos</h2>
                    <ul style="list-style: none; padding-left: 20px; margin: 10px 0;">
                        <li>
                            <a href="manajemen_kos.html">
                                <i class="fas fa-house-user"></i> <span>Manajemen Kos</span>
                            </a>
                        </li>
                        <li><a href="custom_facility.html"><i class="fas fa-bed"></i> <span>Manajemen Fasilitas Custom Facility</span></a></li>
                        <li><a href="transaksi.html"><i class="fas fa-wallet"></i> <span>Transaksi</span></a></li>
                    </ul>
                </li>
            </ul>
        </div>
    `;
  document.getElementById("sidebar-container").innerHTML = sidebarHTML;
}

function loadHeader() {
  let pageTitle = "Dasbor Pemilik Kos"; // Default title

  // Ambil nama halaman dari URL atau title dokumen
  const path = window.location.pathname;
  if (path.includes("manajemen_kamar_kos")) {
    pageTitle = "Manajemen Kamar Kos";
  } else if (path.includes("manajemen_kos")) {
    pageTitle = "Manajemen Kos";
  } else if (path.includes("custom_facility")) {
    pageTitle = "Manajemen Fasilitas Custom";
  } else if (path.includes("transaksi")) {
    pageTitle = "Manajemen Transaksi";
  } else if (path.includes("invoice")) {
    pageTitle = "Detail Transaksi";
  } else if (path.includes("edit_kos")) {
    pageTitle = "Edit Kos";
  } else if (path.includes("tambah_kos")) {
    pageTitle = "Tambah Kos";
  } else if (path.includes("edit_kamar_kos")) {
    pageTitle = "Edit Kamar Kos";
  } else if (path.includes("tambah_kamar_kos")) {
    pageTitle = "Tambah Kamar Kos";
  }

  const headerHTML = `
        <div class="dashboard-header">
            <h1>${pageTitle}</h1>
            <div class="header-icons">
                <a href="#"><i class="fas fa-bell"></i></a>
                <a href="#"><i class="fas fa-cog"></i></a>
                <div class="user-dropdown">
                    <div class="user-info" onclick="toggleDropdown()">
                        <div class="top-row">
                            <span class="name">Loading...</span>
                            <i class="fas fa-user"></i>
                            <i class="fas fa-caret-down"></i>
                        </div>
                        <span class="role">Pemilik Kos</span>
                    </div>
                </div>
                <ul class="dropdown-menu">
                    <li><a href="#"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                </ul>
            </div>
        </div>
    `;

  document.getElementById("header-container").innerHTML = headerHTML;
}

// Panggil fungsi setelah halaman dimuat
window.onload = function () {
  loadHeader();
};