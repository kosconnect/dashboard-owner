function toggleDropdown() {
    const userDropdown = document.querySelector('.user-dropdown');
    userDropdown.classList.toggle('active');
}

// Menutup dropdown jika klik di luar
document.addEventListener('click', function (event) {
    const userDropdown = document.querySelector('.user-dropdown');
    const isClickInside = userDropdown.contains(event.target);

    if (!isClickInside) {
        userDropdown.classList.remove('active');
    }
});

// function toggleDropdown(id) {
//     const dropdown = document.getElementById(id);
//     if (dropdown.style.display === "none" || dropdown.style.display === "") {
//         dropdown.style.display = "block";
//     } else {
//         dropdown.style.display = "none";
//     }
// }