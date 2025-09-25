// Admin Panel JavaScript
class AdminPanel {
  constructor() {
    this.token = localStorage.getItem("adminToken");
    this.currentSection = "dashboard";
    this.currentUser = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
  }

  setupEventListeners() {
    // Login form
    document
      .getElementById("loginForm")
      .addEventListener("submit", (e) => this.handleLogin(e));

    // Logout
    document
      .getElementById("logoutBtn")
      .addEventListener("click", () => this.handleLogout());

    // Sidebar toggle
    document
      .getElementById("sidebarToggle")
      .addEventListener("click", () => this.toggleSidebar());

    // Navigation links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.showSection(section);
      });
    });

    // Course management
    document
      .getElementById("addCourseBtn")
      .addEventListener("click", () => this.showCourseModal());
    document
      .getElementById("closeCourseModal")
      .addEventListener("click", () => this.hideCourseModal());
    document
      .getElementById("cancelCourse")
      .addEventListener("click", () => this.hideCourseModal());
    document
      .getElementById("courseForm")
      .addEventListener("submit", (e) => this.handleCourseSubmit(e));

    // Service management
    document
      .getElementById("addServiceBtn")
      .addEventListener("click", () => this.showServiceModal());
    document
      .getElementById("closeServiceModal")
      .addEventListener("click", () => this.hideServiceModal());
    document
      .getElementById("cancelService")
      .addEventListener("click", () => this.hideServiceModal());
    document
      .getElementById("serviceForm")
      .addEventListener("submit", (e) => this.handleServiceSubmit(e));

    // Contact form
    document
      .getElementById("contactForm")
      .addEventListener("submit", (e) => this.handleContactSubmit(e));

    // Media upload
    document
      .getElementById("mediaUpload")
      .addEventListener("change", (e) => this.handleMediaUpload(e));

    // User management
    document
      .getElementById("addUserBtn")
      .addEventListener("click", () => this.showUserModal());
    document
      .getElementById("closeUserModal")
      .addEventListener("click", () => this.hideUserModal());
    document
      .getElementById("cancelUser")
      .addEventListener("click", () => this.hideUserModal());
    document
      .getElementById("userForm")
      .addEventListener("submit", (e) => this.handleUserSubmit(e));

    // Browse image buttons
    document.querySelectorAll(".browseImageBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.browseImage(e));
    });
    document
      .getElementById("browseCourseImage")
      .addEventListener("click", (e) => this.browseImage(e));

    // Close modals on outside click
    document.getElementById("courseModal").addEventListener("click", (e) => {
      if (e.target.id === "courseModal") this.hideCourseModal();
    });
    document.getElementById("serviceModal").addEventListener("click", (e) => {
      if (e.target.id === "serviceModal") this.hideServiceModal();
    });
    document.getElementById("userModal").addEventListener("click", (e) => {
      if (e.target.id === "userModal") this.hideUserModal();
    });
  }

  async checkAuth() {
    if (!this.token) {
      this.showLoginScreen();
      return;
    }

    try {
      const response = await this.apiCall("/api/auth/verify", "GET");
      if (response.valid) {
        this.currentUser = response.user;
        this.showAdminDashboard();
        this.loadDashboardData();
        this.setupRoleBasedUI();
      } else {
        this.showLoginScreen();
      }
    } catch (error) {
      this.showLoginScreen();
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");
    const loginText = document.getElementById("loginText");
    const loginSpinner = document.getElementById("loginSpinner");
    const loginError = document.getElementById("loginError");

    // Show loading state
    loginBtn.disabled = true;
    loginText.textContent = "Signing In...";
    loginSpinner.classList.remove("hidden");

    try {
      const response = await this.apiCall("/api/auth/login", "POST", {
        username,
        password,
      });

      this.token = response.token;
      this.currentUser = response.user;
      localStorage.setItem("adminToken", this.token);
      this.showAdminDashboard();
      this.loadDashboardData();
      this.setupRoleBasedUI();
      this.showToast("Login successful!", "success");
    } catch (error) {
      loginError.textContent = error.message || "Login failed";
      loginError.classList.remove("hidden");
    } finally {
      loginBtn.disabled = false;
      loginText.textContent = "Sign In";
      loginSpinner.classList.add("hidden");
    }
  }

  handleLogout() {
    localStorage.removeItem("adminToken");
    this.token = null;
    this.currentUser = null;
    this.showLoginScreen();
    this.showToast("Logged out successfully", "info");
  }

  setupRoleBasedUI() {
    if (!this.currentUser) return;

    const userManagementNav = document.getElementById("userManagementNav");

    // Show/hide user management based on role
    if (this.currentUser.role === "admin") {
      userManagementNav.classList.remove("hidden");
    } else {
      userManagementNav.classList.add("hidden");
    }
  }

  showLoginScreen() {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("adminDashboard").classList.add("hidden");
    document.getElementById("loginError").classList.add("hidden");
    document.getElementById("loginForm").reset();
  }

  showAdminDashboard() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("adminDashboard").classList.remove("hidden");
    this.showSection("dashboard");
  }

  showSection(section) {
    // Hide all sections
    document.querySelectorAll(".content-section").forEach((el) => {
      el.classList.add("hidden");
    });

    // Show selected section
    document.getElementById(`${section}Section`).classList.remove("hidden");

    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("bg-primary", "text-white");
      link.classList.add("text-gray-700");
    });

    document
      .querySelector(`[data-section="${section}"]`)
      .classList.add("bg-primary", "text-white");
    document
      .querySelector(`[data-section="${section}"]`)
      .classList.remove("text-gray-700");

    this.currentSection = section;

    // Load section data
    switch (section) {
      case "dashboard":
        this.loadDashboardData();
        break;
      case "courses":
        this.loadCourses();
        break;
      case "services":
        this.loadServices();
        break;
      case "contact":
        this.loadContactInfo();
        break;
      case "media":
        this.loadMediaFiles();
        break;
      case "users":
        this.loadUsers();
        break;
    }

    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      this.toggleSidebar(true);
    }
  }

  toggleSidebar(force = false) {
    const sidebar = document.getElementById("sidebar");
    if (force) {
      sidebar.classList.add("-translate-x-full");
    } else {
      sidebar.classList.toggle("-translate-x-full");
    }
  }

  async loadDashboardData() {
    try {
      const [courses, services, media, analytics] = await Promise.all([
        this.apiCall("/api/admin/courses", "GET"),
        this.apiCall("/api/admin/services", "GET"),
        this.apiCall("/api/upload/files", "GET"),
        this.apiCall("/api/analytics", "GET"),
      ]);

      document.getElementById("totalCourses").textContent = courses.length;
      document.getElementById("totalServices").textContent = services.length;
      document.getElementById("totalMedia").textContent = media.length;
      this.setVisitsCard(
        analytics.totals?.visits || 0,
        analytics.totals?.uniqueVisitors || 0,
        analytics.today || { visits: 0, uniqueVisitors: 0 }
      );
      this.renderCharts(analytics);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  setVisitsCard(totalVisits, totalUnique, todayStats) {
    // Ensure a card exists; if not, create it once
    if (!document.getElementById("visitsCard")) {
      const grid = document.querySelector("#dashboardSection .grid");
      const card = document.createElement("div");
      card.className =
        "bg-white p-6 rounded-lg shadow-sm border border-gray-200";
      card.id = "visitsCard";
      card.innerHTML = `
                <div class="flex items-center">
                    <div class="p-3 bg-indigo-100 rounded-lg">
                        <i class="fas fa-users text-indigo-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Site Visits</p>
                        <p id="totalVisits" class="text-2xl font-bold text-gray-900">-</p>
                        <p class="text-xs text-gray-500">Unique: <span id="totalUnique">-</span> • Today: <span id="todayVisits">-</span>/<span id="todayUnique">-</span></p>
                    </div>
                </div>`;
      grid.appendChild(card);
    }
    const el = document.getElementById("totalVisits");
    if (el) el.textContent = totalVisits;
    const u = document.getElementById("totalUnique");
    if (u) u.textContent = totalUnique;
    const tv = document.getElementById("todayVisits");
    if (tv) tv.textContent = todayStats.visits || 0;
    const tu = document.getElementById("todayUnique");
    if (tu) tu.textContent = todayStats.uniqueVisitors || 0;
  }

  renderCharts(analytics) {
    try {
      const ctx7d = document.getElementById("visits7dChart");
      const ctxTop = document.getElementById("topPathsChart");

      const labels7 = (analytics.last7Days || []).map((d) => d.date);
      const visits7 = (analytics.last7Days || []).map((d) => d.visits);
      const unique7 = (analytics.last7Days || []).map(
        (d) => d.uniqueVisitors || 0
      );

      if (ctx7d) {
        if (!this._visitsChart) {
          this._visitsChart = new Chart(ctx7d, {
            type: "line",
            data: {
              labels: labels7,
              datasets: [
                {
                  label: "Visits",
                  data: visits7,
                  borderColor: "#2563eb",
                  backgroundColor: "rgba(37,99,235,0.2)",
                  tension: 0.3,
                },
                {
                  label: "Unique",
                  data: unique7,
                  borderColor: "#10b981",
                  backgroundColor: "rgba(16,185,129,0.2)",
                  tension: 0.3,
                },
              ],
            },
            options: {
              responsive: false,
              animation: { duration: 200 },
              plugins: { legend: { position: "bottom" } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            },
          });
        } else {
          this._visitsChart.data.labels = labels7;
          this._visitsChart.data.datasets[0].data = visits7;
          this._visitsChart.data.datasets[1].data = unique7;
          this._visitsChart.update();
        }
      }

      const labelsTop = (analytics.topPaths || []).map((p) => p.path);
      const dataTop = (analytics.topPaths || []).map((p) => p.visits);

      if (ctxTop) {
        if (!this._topPathsChart) {
          this._topPathsChart = new Chart(ctxTop, {
            type: "bar",
            data: {
              labels: labelsTop,
              datasets: [
                { label: "Visits", data: dataTop, backgroundColor: "#6366f1" },
              ],
            },
            options: {
              responsive: false,
              animation: { duration: 200 },
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            },
          });
        } else {
          this._topPathsChart.data.labels = labelsTop;
          this._topPathsChart.data.datasets[0].data = dataTop;
          this._topPathsChart.update();
        }
      }
    } catch (e) {
      console.error("Error rendering charts", e);
    }
  }

  async loadCourses() {
    try {
      const courses = await this.apiCall("/api/admin/courses", "GET");
      const container = document.getElementById("coursesList");

      if (courses.length === 0) {
        container.innerHTML =
          '<p class="text-gray-500 text-center py-8">No courses found. Add your first course!</p>';
        return;
      }

      container.innerHTML = courses
        .map(
          (course) => `
                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300">
                    <div class="flex flex-col md:flex-row items-start justify-between gap-2">
                        <div class="flex items-center space-x-4">
                            <img src="${course.image}" alt="${course.alt}" class="w-16 h-16 object-cover rounded-lg">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 max-w-3xl">${course.title}</h3>
                                <p class="text-sm text-gray-600">Level: ${course.level}</p>
                                <p class="text-sm text-gray-600">${course.outlines.length} topics</p>
                            </div>
                        </div>
                        <div class="flex space-x-2 items-center justify-center">
                            <button onclick="admin.editCourse('${course.id}')" 
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button onclick="admin.deleteCourse('${course.id}')" 
                                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    } catch (error) {
      this.showToast("Error loading courses", "error");
    }
  }

  async loadServices() {
    try {
      const services = await this.apiCall("/api/admin/services", "GET");
      const container = document.getElementById("servicesList");

      if (services.length === 0) {
        container.innerHTML =
          '<p class="text-gray-500 text-center py-8">No services found. Add your first service!</p>';
        return;
      }

      container.innerHTML = services
        .map(
          (service) => `
                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300">
                    <div class="flex flex-col md:flex-row items-start justify-between gap-2">
                        <div class="flex items-center space-x-4">
                            <img src="${service.images.image1}" alt="${service.title}" class="w-16 h-16 object-cover rounded-lg">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 max-w-3xl">${service.title}</h3>
                                <p class="text-sm text-gray-600 line-clamp-2 max-w-3xl">${service.description}</p>
                            </div>
                        </div>
                        <div class="flex space-x-2  items-center justify-center">
                            <button onclick="admin.editService('${service.id}')" 
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button onclick="admin.deleteService('${service.id}')" 
                                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    } catch (error) {
      this.showToast("Error loading services", "error");
    }
  }

  async loadContactInfo() {
    try {
      const contact = await this.apiCall("/api/admin/contact", "GET");
      document.getElementById("contactTitle").value = contact.title;
      document.getElementById("contactEmail").value = contact.email;
      document.getElementById("contactAddress").value = contact.address;
      document.getElementById("contactPhones").value = (
        contact.phone ? Object.values(contact.phone) : []
      ).join("\n");
      document.getElementById("contactFacebook").value =
        contact.social.facebook || "";
      document.getElementById("contactYoutube").value =
        contact.social.youtube || "";
      document.getElementById("contactTiktok").value =
        contact.social.tiktok || "";
      document.getElementById("contactViber").value =
        contact.social.viber || "";
    } catch (error) {
      this.showToast("Error loading contact info", "error");
    }
  }

  async loadMediaFiles() {
    try {
      const files = await this.apiCall("/api/upload/files", "GET");
      const container = document.getElementById("mediaGrid");

      if (files.length === 0) {
        container.innerHTML =
          '<p class="text-gray-500 text-center py-8 col-span-full">No media files found. Upload some images!</p>';
        return;
      }

      container.innerHTML = files
        .map(
          (file) => `
                <div class="relative group">
                    <img src="${file.url}" alt="${file.filename}" class="w-full h-24 object-cover rounded-lg">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition duration-300 flex items-center justify-center">
                        <div class="opacity-0 group-hover:opacity-100 transition duration-300 flex space-x-2">
                            <button onclick="admin.copyImageUrl('${file.url}')" 
                                    class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="admin.deleteMediaFile('${file.filename}')" 
                                    class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition duration-300">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mt-1 truncate">${file.filename}</p>
                </div>
            `
        )
        .join("");
    } catch (error) {
      this.showToast("Error loading media files", "error");
    }
  }

  showCourseModal(courseId = null) {
    const modal = document.getElementById("courseModal");
    const title = document.getElementById("courseModalTitle");
    const form = document.getElementById("courseForm");

    if (courseId) {
      title.textContent = "Edit Course";
      this.loadCourseData(courseId);
    } else {
      title.textContent = "Add New Course";
      form.reset();
      document.getElementById("courseId").value = "";
    }

    modal.classList.remove("hidden");
  }

  hideCourseModal() {
    document.getElementById("courseModal").classList.add("hidden");
  }

  showServiceModal(serviceId = null) {
    const modal = document.getElementById("serviceModal");
    const title = document.getElementById("serviceModalTitle");
    const form = document.getElementById("serviceForm");

    if (serviceId) {
      title.textContent = "Edit Service";
      this.loadServiceData(serviceId);
    } else {
      title.textContent = "Add New Service";
      form.reset();
      document.getElementById("serviceId").value = "";
    }

    modal.classList.remove("hidden");
  }

  hideServiceModal() {
    document.getElementById("serviceModal").classList.add("hidden");
  }

  async loadCourseData(courseId) {
    try {
      const course = await this.apiCall(
        `/api/admin/courses/${courseId}`,
        "GET"
      );

      document.getElementById("courseId").value = course.id;
      document.getElementById("courseTitle").value = course.title;
      document.getElementById("courseLevel").value = course.level;
      document.getElementById("courseImage").value = course.image;
      document.getElementById("courseOutlines").value =
        course.outlines.join("\n");
    } catch (error) {
      this.showToast("Error loading course data", "error");
    }
  }

  async loadServiceData(serviceId) {
    try {
      const service = await this.apiCall(
        `/api/admin/services/${serviceId}`,
        "GET"
      );

      document.getElementById("serviceId").value = service.id;
      document.getElementById("serviceTitle").value = service.title;
      document.getElementById("serviceDescription").value = service.description;
      document.getElementById("serviceImage1").value = service.images.image1;
      document.getElementById("serviceImage2").value = service.images.image2;
      document.getElementById("serviceImage3").value = service.images.image3;
      document.getElementById("serviceOutlines").value = service.outlines
        ? service.outlines.join("\n")
        : "";
    } catch (error) {
      this.showToast("Error loading service data", "error");
    }
  }

  async handleCourseSubmit(e) {
    e.preventDefault();

    const courseId = document.getElementById("courseId").value;
    const courseData = {
      title: document.getElementById("courseTitle").value,
      level: document.getElementById("courseLevel").value,
      image: document.getElementById("courseImage").value,
      alt: document.getElementById("courseTitle").value,
      outlines: document
        .getElementById("courseOutlines")
        .value.split("\n")
        .filter((line) => line.trim()),
    };

    try {
      if (courseId) {
        await this.apiCall(`/api/admin/courses/${courseId}`, "PUT", courseData);
        this.showToast("Course updated successfully!", "success");
      } else {
        await this.apiCall("/api/admin/courses", "POST", courseData);
        this.showToast("Course created successfully!", "success");
      }

      this.hideCourseModal();
      this.loadCourses();
      this.loadDashboardData();
    } catch (error) {
      this.showToast("Error saving course", "error");
    }
  }

  async handleServiceSubmit(e) {
    e.preventDefault();

    const serviceId = document.getElementById("serviceId").value;
    const serviceData = {
      title: document.getElementById("serviceTitle").value,
      description: document.getElementById("serviceDescription").value,
      images: {
        image1: document.getElementById("serviceImage1").value,
        image2: document.getElementById("serviceImage2").value,
        image3: document.getElementById("serviceImage3").value,
      },
      outlines: document
        .getElementById("serviceOutlines")
        .value.split("\n")
        .filter((line) => line.trim()),
    };

    try {
      if (serviceId) {
        await this.apiCall(
          `/api/admin/services/${serviceId}`,
          "PUT",
          serviceData
        );
        this.showToast("Service updated successfully!", "success");
      } else {
        await this.apiCall("/api/admin/services", "POST", serviceData);
        this.showToast("Service created successfully!", "success");
      }

      this.hideServiceModal();
      this.loadServices();
      this.loadDashboardData();
    } catch (error) {
      this.showToast("Error saving service", "error");
    }
  }

  async handleContactSubmit(e) {
    e.preventDefault();

    const contactData = {
      title: document.getElementById("contactTitle").value,
      email: document.getElementById("contactEmail").value,
      address: document.getElementById("contactAddress").value,
      phone: document
        .getElementById("contactPhones")
        .value.split("\n")
        .filter((line) => line.trim()),
      social: {
        facebook: document.getElementById("contactFacebook").value,
        youtube: document.getElementById("contactYoutube").value,
        tiktok: document.getElementById("contactTiktok").value,
        viber: document.getElementById("contactViber").value,
      },
    };

    try {
      await this.apiCall("/api/admin/contact", "PUT", contactData);
      this.showToast("Contact information updated successfully!", "success");
    } catch (error) {
      this.showToast("Error updating contact info", "error");
    }
  }

  async handleMediaUpload(e) {
    const files = e.target.files;
    if (files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("/api/upload/multiple", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      this.showToast(
        `${result.files.length} files uploaded successfully!`,
        "success"
      );
      this.loadMediaFiles();
      this.loadDashboardData();
    } catch (error) {
      this.showToast("Error uploading files", "error");
    }

    e.target.value = "";
  }

  async browseImage(e) {
    const targetId = e.target.dataset.target || "courseImage";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/api/upload/single", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();
        document.getElementById(targetId).value = result.url;
        this.showToast("Image uploaded successfully!", "success");
      } catch (error) {
        console.log(error);
        this.showToast("Error uploading image", "error");
      }
    };

    input.click();
  }

  async editCourse(courseId) {
    this.showCourseModal(courseId);
  }

  async editService(serviceId) {
    this.showServiceModal(serviceId);
  }

  async deleteCourse(courseId) {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await this.apiCall(`/api/admin/courses/${courseId}`, "DELETE");
      this.showToast("Course deleted successfully!", "success");
      this.loadCourses();
      this.loadDashboardData();
    } catch (error) {
      this.showToast("Error deleting course", "error");
    }
  }

  async deleteService(serviceId) {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      await this.apiCall(`/api/admin/services/${serviceId}`, "DELETE");
      this.showToast("Service deleted successfully!", "success");
      this.loadServices();
      this.loadDashboardData();
    } catch (error) {
      this.showToast("Error deleting service", "error");
    }
  }

  async deleteMediaFile(filename) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await this.apiCall(`/api/upload/${filename}`, "DELETE");
      this.showToast("File deleted successfully!", "success");
      this.loadMediaFiles();
      this.loadDashboardData();
    } catch (error) {
      this.showToast("Error deleting file", "error");
    }
  }

  copyImageUrl(url) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.showToast("Image URL copied to clipboard!", "success");
      })
      .catch(() => {
        this.showToast("Failed to copy URL", "error");
      });
  }

  async apiCall(endpoint, method = "GET", data = null) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "API call failed");
    }

    return await response.json();
  }

  // User Management Methods
  async loadUsers() {
    try {
      const users = await this.apiCall("/api/users", "GET");
      const container = document.getElementById("usersList");

      if (users.length === 0) {
        container.innerHTML =
          '<p class="text-gray-500 text-center py-8">No users found. Add your first user!</p>';
        return;
      }

      container.innerHTML = users
        .map(
          (user) => `
                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300">
                    <div class="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div class="w-full flex md:hidden  justify-center">
                            <div class="flex w-24 h-24 bg-primary rounded-full items-center justify-center text-white font-bold">
                                ${
                                  user.firstName
                                    ? user.firstName.charAt(0).toUpperCase()
                                    : user.username.charAt(0).toUpperCase()
                                }
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="hidden md:flex w-12 h-12 bg-primary rounded-full items-center justify-center text-white font-bold">
                                    ${
                                      user.firstName
                                        ? user.firstName.charAt(0).toUpperCase()
                                        : user.username.charAt(0).toUpperCase()
                                    }
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">
                                    ${user.firstName} ${user.lastName}
                                </h3>
                                <p class="text-sm text-gray-600">
                                    @${user.username}
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      user.role === "admin"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                    }">
                                        ${
                                          user.role === "admin"
                                            ? "Admin"
                                            : "User"
                                        }
                                    </span>
                                </p>
                                
                                <p class="text-sm text-gray-600">${
                                  user.email
                                }</p>
                                <div class="flex items-center space-x-2 mt-1">
                                    
                                    ${
                                      user.lastLogin
                                        ? `<span class="text-xs text-gray-500">
                                            Last login: ${new Date(
                                              user.lastLogin
                                            ).toLocaleString("en-US", {
                                              year: "numeric",
                                              month: "2-digit",
                                              day: "2-digit",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              second: "2-digit",
                                            })}
                                            </span>
                                            `
                                        : '<span class="text-xs text-gray-500">Never logged in</span>'
                                    }
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col items-start gap-2 md:gap-0 md:flex-row md:space-x-2 md:items-center">
                            <button onclick="admin.editUser('${user.id}')" 
                                    class="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button onclick="admin.resetUserPassword('${
                              user.id
                            }')" 
                                    class="text-sm bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300">
                                <i class="fas fa-key mr-1"></i>Reset Password
                            </button>
                            ${
                              user.id !== this.currentUser.id
                                ? `<button onclick="admin.deleteUser('${user.id}')" 
                                        class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300">
                                    <i class="fas fa-trash mr-1"></i>Delete
                                </button>`
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    } catch (error) {
      this.showToast("Error loading users", "error");
    }
  }

  showUserModal(userId = null) {
    const modal = document.getElementById("userModal");
    const title = document.getElementById("userModalTitle");
    const form = document.getElementById("userForm");
    const passwordFields = document.getElementById("passwordFields");

    if (userId) {
      title.textContent = "Edit User";
      passwordFields.style.display = "none";
      document.getElementById("userPassword").required = false;
      this.loadUserData(userId);
    } else {
      title.textContent = "Add New User";
      passwordFields.style.display = "block";
      document.getElementById("userPassword").required = true;
      form.reset();
      document.getElementById("userId").value = "";
    }

    modal.classList.remove("hidden");
  }

  hideUserModal() {
    document.getElementById("userModal").classList.add("hidden");
  }

  async loadUserData(userId) {
    try {
      const user = await this.apiCall(`/api/users/${userId}`, "GET");

      document.getElementById("userId").value = user.id;
      document.getElementById("userUsername").value = user.username;
      document.getElementById("userRole").value = user.role;
      document.getElementById("userEmail").value = user.email;
      document.getElementById("userFirstName").value = user.firstName;
      document.getElementById("userLastName").value = user.lastName;
    } catch (error) {
      this.showToast("Error loading user data", "error");
    }
  }

  checkPassword(password) {
    if (password.length < 8 || password.length > 128) {
      return false;
    }
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!regex.test(password)) {
      return false;
    }
    return true;
  }

  async handleUserSubmit(e) {
    e.preventDefault();
    const userId = document.getElementById("userId").value;
    const userData = {
      username: document.getElementById("userUsername").value,
      role: document.getElementById("userRole").value,
      email: document.getElementById("userEmail").value,
      firstName: document.getElementById("userFirstName").value,
      lastName: document.getElementById("userLastName").value,
    };

    // Add password for new users
    if (!userId) {
      const password = document.getElementById("userPassword").value;
      if (!this.checkPassword(password)) {
        this.showToast("Please set a strong password!", "warning");
        return;
      }
      userData.password = password;
    }

    try {
      let resp;
      if (userId) {
        resp = await this.apiCall(`/api/users/${userId}`, "PUT", userData);
        if (resp && resp.otpId) {
          const code = prompt("Enter the 6-digit OTP sent to the admin email:");
          if (!code) return;
          await this.apiCall("/api/users/verify/update-admin", "POST", {
            otpId: resp.otpId,
            code: String(code).trim(),
          });
          this.showToast("Admin updated successfully after OTP!", "success");
        } else {
          this.showToast("User updated successfully!", "success");
        }
      } else {
        resp = await this.apiCall("/api/users", "POST", userData);
        if (resp && resp.otpId) {
          const code = prompt("Enter the 6-digit OTP sent to the admin email:");
          if (!code) return;
          await this.apiCall("/api/users/verify/create-admin", "POST", {
            otpId: resp.otpId,
            code: String(code).trim(),
          });
          this.showToast("Admin created successfully after OTP!", "success");
        } else {
          this.showToast("User created successfully!", "success");
        }
      }

      this.hideUserModal();
      this.loadUsers();
    } catch (error) {
      this.showToast(error, "error");
    }
  }

  async editUser(userId) {
    this.showUserModal(userId);
  }

  async deleteUser(userId) {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      await this.apiCall(`/api/users/${userId}`, "DELETE");
      this.showToast("User deleted successfully!", "success");
      this.loadUsers();
    } catch (error) {
      this.showToast("Error deleting user", "error");
    }
  }

  async resetUserPassword(userId) {
    const newPassword = prompt(
      "Enter new password for this user (min 8 characters):"
    );
    if (!newPassword) return;

    if (newPassword.length < 8) {
      this.showToast("Password must be at least 8 characters long", "error");
      return;
    }

    try {
      const resp = await this.apiCall(`/api/users/${userId}/password`, "PUT", {
        newPassword,
      });
      if (resp && resp.otpId) {
        const code = prompt("Enter the 6-digit OTP sent to the admin email:");
        if (!code) return;
        await this.apiCall("/api/users/verify/update-admin-password", "POST", {
          otpId: resp.otpId,
          code: String(code).trim(),
        });
        this.showToast(
          "Admin password updated successfully after OTP!",
          "success"
        );
      } else {
        this.showToast("Password reset successfully!", "success");
      }
    } catch (error) {
      this.showToast("Error resetting password", "error");
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500",
    };

    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };

    toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 fade-in`;
    toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize admin panel when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.admin = new AdminPanel();
});
