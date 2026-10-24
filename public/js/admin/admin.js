// Refactored admin panel orchestrator. Same behavior as the legacy
// single-file admin panel — auth flow, section routing, and CRUD payloads
// are unchanged; only the API/toast/DOM/template/chart helpers are imported.
import { ENDPOINTS, createApiClient } from "./api.js";
import { showToast } from "./toast.js";
import { $, getValue, setValue, getLines, setLines, setText } from "./dom.js";
import { showModalById, hideModalById, bindModalOutsideClick } from "./modals.js";
import { isStrongPassword } from "./validation.js";
import { setVisitsCard, renderCharts } from "./charts.js";
import { emptyState, emptyStateFull, courseCard, serviceCard, mediaCard, userCard } from "./templates.js";

const TOKEN_KEY = "adminToken";

export class AdminPanel {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    this.currentSection = "dashboard";
    this.currentUser = null;
    const client = createApiClient(() => this.token);
    this.apiCall = client.apiCall;
    this.uploadSingle = client.uploadSingle;
    this.uploadMultiple = client.uploadMultiple;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
  }

  // ---------- events ----------
  setupEventListeners() {
    $("loginForm")?.addEventListener("submit", (e) => this.handleLogin(e));
    $("logoutBtn")?.addEventListener("click", () => this.handleLogout());
    $("sidebarToggle")?.addEventListener("click", () => this.toggleSidebar());

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.showSection(link.dataset.section);
      });
    });

    $("addCourseBtn")?.addEventListener("click", () => this.showCourseModal());
    $("closeCourseModal")?.addEventListener("click", () => this.hideCourseModal());
    $("cancelCourse")?.addEventListener("click", () => this.hideCourseModal());
    $("courseForm")?.addEventListener("submit", (e) => this.handleCourseSubmit(e));

    $("addServiceBtn")?.addEventListener("click", () => this.showServiceModal());
    $("closeServiceModal")?.addEventListener("click", () => this.hideServiceModal());
    $("cancelService")?.addEventListener("click", () => this.hideServiceModal());
    $("serviceForm")?.addEventListener("submit", (e) => this.handleServiceSubmit(e));

    $("contactForm")?.addEventListener("submit", (e) => this.handleContactSubmit(e));
    $("mediaUpload")?.addEventListener("change", (e) => this.handleMediaUpload(e));

    $("addUserBtn")?.addEventListener("click", () => this.showUserModal());
    $("closeUserModal")?.addEventListener("click", () => this.hideUserModal());
    $("cancelUser")?.addEventListener("click", () => this.hideUserModal());
    $("userForm")?.addEventListener("submit", (e) => this.handleUserSubmit(e));

    // Unified image-browse buttons (course modal now uses data-target too).
    document.querySelectorAll(".browseImageBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.browseImage(e));
    });

    ["courseModal", "serviceModal", "userModal"].forEach(bindModalOutsideClick);

    // Replaces inline onclick="admin.*" in list templates.
    $("coursesList")?.addEventListener("click", (e) => this.onCoursesClick(e));
    $("servicesList")?.addEventListener("click", (e) => this.onServicesClick(e));
    $("mediaGrid")?.addEventListener("click", (e) => this.onMediaClick(e));
    $("usersList")?.addEventListener("click", (e) => this.onUsersClick(e));
  }

  onCoursesClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "edit-course") this.editCourse(id);
    if (action === "delete-course") this.deleteCourse(id);
  }

  onServicesClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "edit-service") this.editService(id);
    if (action === "delete-service") this.deleteService(id);
  }

  onMediaClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "copy-url") this.copyImageUrl(btn.dataset.url);
    if (btn.dataset.action === "delete-media") this.deleteMediaFile(btn.dataset.id);
  }

  onUsersClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "edit-user") this.editUser(id);
    if (action === "delete-user") this.deleteUser(id);
    if (action === "reset-password") this.resetUserPassword(id);
  }

  // ---------- auth ----------
  async checkAuth() {
    if (!this.token) {
      this.showLoginScreen();
      return;
    }
    try {
      const response = await this.apiCall(ENDPOINTS.verify, "GET");
      if (response.valid) {
        this.currentUser = response.user;
        this.showAdminDashboard();
        this.loadDashboardData();
        this.setupRoleBasedUI();
      } else {
        this.showLoginScreen();
      }
    } catch {
      this.showLoginScreen();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = getValue("username");
    const password = getValue("password");
    const loginBtn = $("loginBtn");
    const loginText = $("loginText");
    const loginSpinner = $("loginSpinner");
    const loginError = $("loginError");

    if (loginBtn) loginBtn.disabled = true;
    if (loginText) loginText.textContent = "Signing In...";
    if (loginSpinner) loginSpinner.style.display = "inline-block";

    try {
      const response = await this.apiCall(ENDPOINTS.login, "POST", { username, password });
      this.token = response.token;
      this.currentUser = response.user;
      localStorage.setItem(TOKEN_KEY, this.token);
      this.showAdminDashboard();
      this.loadDashboardData();
      this.setupRoleBasedUI();
      showToast("Login successful!", "success");
    } catch (error) {
      console.log(error);
      if (loginError) {
        loginError.textContent = error.message || "Login failed";
        loginError.classList.remove("hidden");
      }
      if (loginSpinner) loginSpinner.style.display = "none";
    } finally {
      if (loginBtn) loginBtn.disabled = false;
      if (loginText) loginText.textContent = "Sign In";
      if (loginSpinner) loginSpinner.style.display = "none";
    }
  }

  handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    this.token = null;
    this.currentUser = null;
    this.showLoginScreen();
    showToast("Logged out successfully", "info");
  }

  setupRoleBasedUI() {
    if (!this.currentUser) return;
    $("userManagementNav")?.classList.toggle("hidden", this.currentUser.role !== "admin");
  }

  showLoginScreen() {
    $("loginScreen")?.classList.remove("hidden");
    $("adminDashboard")?.classList.add("hidden");
    $("loginError")?.classList.add("hidden");
    $("loginForm")?.reset();
  }

  showAdminDashboard() {
    $("loginScreen")?.classList.add("hidden");
    $("adminDashboard")?.classList.remove("hidden");
    this.showSection("dashboard");
  }

  showSection(section) {
    document.querySelectorAll(".content-section").forEach((el) => el.classList.add("hidden"));
    $(`${section}Section`)?.classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("bg-primary", "text-white");
      link.classList.add("text-gray-700");
    });
    document.querySelector(`[data-section="${section}"]`)?.classList.add("bg-primary", "text-white");
    document.querySelector(`[data-section="${section}"]`)?.classList.remove("text-gray-700");

    this.currentSection = section;
    ({ dashboard: () => this.loadDashboardData(),
       courses: () => this.loadCourses(),
       services: () => this.loadServices(),
       contact: () => this.loadContactInfo(),
       media: () => this.loadMediaFiles(),
       users: () => this.loadUsers(),
    })[section]?.();

    if (window.innerWidth < 1024) this.toggleSidebar(true);
  }

  toggleSidebar(force = false) {
    const sidebar = $("sidebar");
    if (!sidebar) return;
    if (force) sidebar.classList.add("-translate-x-full");
    else sidebar.classList.toggle("-translate-x-full");
  }

  // ---------- dashboard ----------
  async loadDashboardData() {
    try {
      const [courses, services, media, analytics] = await Promise.all([
        this.apiCall(ENDPOINTS.courses, "GET"),
        this.apiCall(ENDPOINTS.services, "GET"),
        this.apiCall(ENDPOINTS.uploadFiles, "GET"),
        this.apiCall(ENDPOINTS.analytics, "GET"),
      ]);
      setText("totalCourses", courses.length);
      setText("totalServices", services.length);
      setText("totalMedia", media.length);
      setVisitsCard(
        analytics.totals?.visits || 0,
        analytics.totals?.uniqueVisitors || 0,
        analytics.today || { visits: 0, uniqueVisitors: 0 }
      );
      renderCharts(this, analytics);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  // ---------- courses ----------
  async loadCourses() {
    try {
      const courses = await this.apiCall(ENDPOINTS.courses, "GET");
      const container = $("coursesList");
      if (!container) return;
      if (courses.length === 0) {
        container.innerHTML = emptyState("No courses found. Add your first course!");
        return;
      }
      container.innerHTML = courses.map(courseCard).join("");
    } catch {
      showToast("Error loading courses", "error");
    }
  }

  showCourseModal(courseId = null) {
    if (courseId) {
      setText("courseModalTitle", "Edit Course");
      this.loadCourseData(courseId);
    } else {
      setText("courseModalTitle", "Add New Course");
      $("courseForm")?.reset();
      setValue("courseId", "");
    }
    showModalById("courseModal");
  }

  hideCourseModal() {
    hideModalById("courseModal");
  }

  async loadCourseData(courseId) {
    try {
      const course = await this.apiCall(`${ENDPOINTS.courses}/${courseId}`, "GET");
      setValue("courseId", course.id);
      setValue("courseTitle", course.title);
      setValue("courseLevel", course.level);
      setValue("courseImage", course.image);
      setValue("courseOutlines", course.outlines.join("\n"));
    } catch {
      showToast("Error loading course data", "error");
    }
  }

  async handleCourseSubmit(e) {
    e.preventDefault();
    const courseId = getValue("courseId");
    const courseData = {
      title: getValue("courseTitle"),
      level: getValue("courseLevel"),
      image: getValue("courseImage"),
      alt: getValue("courseTitle"),
      outlines: getLines("courseOutlines"),
    };
    try {
      if (courseId) {
        await this.apiCall(`${ENDPOINTS.courses}/${courseId}`, "PUT", courseData);
        showToast("Course updated successfully!", "success");
      } else {
        await this.apiCall(ENDPOINTS.courses, "POST", courseData);
        showToast("Course created successfully!", "success");
      }
      this.hideCourseModal();
      this.loadCourses();
      this.loadDashboardData();
    } catch {
      showToast("Error saving course", "error");
    }
  }

  editCourse(courseId) {
    this.showCourseModal(courseId);
  }

  async deleteCourse(courseId) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await this.apiCall(`${ENDPOINTS.courses}/${courseId}`, "DELETE");
      showToast("Course deleted successfully!", "success");
      this.loadCourses();
      this.loadDashboardData();
    } catch {
      showToast("Error deleting course", "error");
    }
  }

  // ---------- services ----------
  async loadServices() {
    try {
      const services = await this.apiCall(ENDPOINTS.services, "GET");
      const container = $("servicesList");
      if (!container) return;
      if (services.length === 0) {
        container.innerHTML = emptyState("No services found. Add your first service!");
        return;
      }
      container.innerHTML = services.map(serviceCard).join("");
    } catch {
      showToast("Error loading services", "error");
    }
  }

  showServiceModal(serviceId = null) {
    if (serviceId) {
      setText("serviceModalTitle", "Edit Service");
      this.loadServiceData(serviceId);
    } else {
      setText("serviceModalTitle", "Add New Service");
      $("serviceForm")?.reset();
      setValue("serviceId", "");
    }
    showModalById("serviceModal");
  }

  hideServiceModal() {
    hideModalById("serviceModal");
  }

  async loadServiceData(serviceId) {
    try {
      const service = await this.apiCall(`${ENDPOINTS.services}/${serviceId}`, "GET");
      setValue("serviceId", service.id);
      setValue("serviceTitle", service.title);
      setValue("serviceDescription", service.description);
      setValue("serviceImage1", service.images.image1);
      setValue("serviceImage2", service.images.image2);
      setValue("serviceImage3", service.images.image3);
      setValue("serviceOutlines", service.outlines ? service.outlines.join("\n") : "");
    } catch {
      showToast("Error loading service data", "error");
    }
  }

  async handleServiceSubmit(e) {
    e.preventDefault();
    const serviceId = getValue("serviceId");
    const serviceData = {
      title: getValue("serviceTitle"),
      description: getValue("serviceDescription"),
      images: {
        image1: getValue("serviceImage1"),
        image2: getValue("serviceImage2"),
        image3: getValue("serviceImage3"),
      },
      outlines: getLines("serviceOutlines"),
    };
    try {
      if (serviceId) {
        await this.apiCall(`${ENDPOINTS.services}/${serviceId}`, "PUT", serviceData);
        showToast("Service updated successfully!", "success");
      } else {
        await this.apiCall(ENDPOINTS.services, "POST", serviceData);
        showToast("Service created successfully!", "success");
      }
      this.hideServiceModal();
      this.loadServices();
      this.loadDashboardData();
    } catch {
      showToast("Error saving service", "error");
    }
  }

  editService(serviceId) {
    this.showServiceModal(serviceId);
  }

  async deleteService(serviceId) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await this.apiCall(`${ENDPOINTS.services}/${serviceId}`, "DELETE");
      showToast("Service deleted successfully!", "success");
      this.loadServices();
      this.loadDashboardData();
    } catch {
      showToast("Error deleting service", "error");
    }
  }

  // ---------- contact ----------
  async loadContactInfo() {
    try {
      const contact = await this.apiCall(ENDPOINTS.contact, "GET");
      setValue("contactTitle", contact.title);
      setValue("contactEmail", contact.email);
      setValue("contactAddress", contact.address);
      setLines("contactPhones", contact.phone ? Object.values(contact.phone) : []);
      setValue("contactFacebook", contact.social.facebook || "");
      setValue("contactYoutube", contact.social.youtube || "");
      setValue("contactTiktok", contact.social.tiktok || "");
      setValue("contactViber", contact.social.viber || "");
    } catch {
      showToast("Error loading contact info", "error");
    }
  }

  async handleContactSubmit(e) {
    e.preventDefault();
    const contactData = {
      title: getValue("contactTitle"),
      email: getValue("contactEmail"),
      address: getValue("contactAddress"),
      phone: getLines("contactPhones"),
      social: {
        facebook: getValue("contactFacebook"),
        youtube: getValue("contactYoutube"),
        tiktok: getValue("contactTiktok"),
        viber: getValue("contactViber"),
      },
    };
    try {
      await this.apiCall(ENDPOINTS.contact, "PUT", contactData);
      showToast("Contact information updated successfully!", "success");
    } catch {
      showToast("Error updating contact info", "error");
    }
  }

  // ---------- media ----------
  async loadMediaFiles() {
    try {
      const files = await this.apiCall(ENDPOINTS.uploadFiles, "GET");
      const container = $("mediaGrid");
      if (!container) return;
      if (files.length === 0) {
        container.innerHTML = emptyStateFull("No media files found. Upload some images!");
        return;
      }
      container.innerHTML = files.map(mediaCard).join("");
    } catch {
      showToast("Error loading media files", "error");
    }
  }

  async handleMediaUpload(e) {
    const files = e.target.files;
    if (files.length === 0) return;
    try {
      const result = await this.uploadMultiple(files);
      showToast(`${result.files.length} files uploaded successfully!`, "success");
      this.loadMediaFiles();
      this.loadDashboardData();
    } catch {
      showToast("Error uploading files", "error");
    }
    e.target.value = "";
  }

  async browseImage(e) {
    const targetId = e.target.dataset.target || e.currentTarget?.dataset?.target || "courseImage";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const result = await this.uploadSingle(file);
        setValue(targetId, result.url);
        showToast("Image uploaded successfully!", "success");
      } catch (error) {
        console.log(error);
        showToast("Error uploading image", "error");
      }
    };
    input.click();
  }

  async deleteMediaFile(filename) {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await this.apiCall(`/api/upload/${filename}`, "DELETE");
      showToast("File deleted successfully!", "success");
      this.loadMediaFiles();
      this.loadDashboardData();
    } catch {
      showToast("Error deleting file", "error");
    }
  }

  copyImageUrl(url) {
    navigator.clipboard
      .writeText(url)
      .then(() => showToast("Image URL copied to clipboard!", "success"))
      .catch(() => showToast("Failed to copy URL", "error"));
  }

  // ---------- users ----------
  async loadUsers() {
    try {
      const users = await this.apiCall(ENDPOINTS.users, "GET");
      const container = $("usersList");
      if (!container) return;
      if (users.length === 0) {
        container.innerHTML = emptyState("No users found. Add your first user!");
        return;
      }
      container.innerHTML = users.map((u) => userCard(u, this.currentUser?.id)).join("");
    } catch {
      showToast("Error loading users", "error");
    }
  }

  showUserModal(userId = null) {
    const passwordFields = $("passwordFields");
    if (userId) {
      setText("userModalTitle", "Edit User");
      if (passwordFields) passwordFields.style.display = "none";
      const pwd = $("userPassword");
      if (pwd) pwd.required = false;
      this.loadUserData(userId);
    } else {
      setText("userModalTitle", "Add New User");
      if (passwordFields) passwordFields.style.display = "block";
      const pwd = $("userPassword");
      if (pwd) pwd.required = true;
      $("userForm")?.reset();
      setValue("userId", "");
    }
    showModalById("userModal");
  }

  hideUserModal() {
    hideModalById("userModal");
  }

  async loadUserData(userId) {
    try {
      const user = await this.apiCall(`${ENDPOINTS.users}/${userId}`, "GET");
      setValue("userId", user.id);
      setValue("userUsername", user.username);
      setValue("userRole", user.role);
      setValue("userEmail", user.email);
      setValue("userFirstName", user.firstName);
      setValue("userLastName", user.lastName);
    } catch {
      showToast("Error loading user data", "error");
    }
  }

  checkPassword(password) {
    return isStrongPassword(password);
  }

  async verifyOtp(endpoint, otpId) {
    const code = prompt("Enter the 6-digit OTP sent to the admin email:");
    if (!code) return false;
    await this.apiCall(endpoint, "POST", { otpId, code: String(code).trim() });
    return true;
  }

  async handleUserSubmit(e) {
    e.preventDefault();
    const userId = getValue("userId");
    const userData = {
      username: getValue("userUsername"),
      role: getValue("userRole"),
      email: getValue("userEmail"),
      firstName: getValue("userFirstName"),
      lastName: getValue("userLastName"),
    };
    if (!userId) {
      const password = getValue("userPassword");
      if (!this.checkPassword(password)) {
        showToast("Please set a strong password!", "warning");
        return;
      }
      userData.password = password;
    }

    try {
      let resp;
      if (userId) {
        resp = await this.apiCall(`${ENDPOINTS.users}/${userId}`, "PUT", userData);
        if (resp?.otpId) {
          if (!(await this.verifyOtp("/api/users/verify/update-admin", resp.otpId))) return;
          showToast("Admin updated successfully after OTP!", "success");
        } else {
          showToast("User updated successfully!", "success");
        }
      } else {
        resp = await this.apiCall(ENDPOINTS.users, "POST", userData);
        if (resp?.otpId) {
          if (!(await this.verifyOtp("/api/users/verify/create-admin", resp.otpId))) return;
          showToast("Admin created successfully after OTP!", "success");
        } else {
          showToast("User created successfully!", "success");
        }
      }
      this.hideUserModal();
      this.loadUsers();
    } catch (error) {
      showToast(error, "error");
    }
  }

  editUser(userId) {
    this.showUserModal(userId);
  }

  async deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await this.apiCall(`${ENDPOINTS.users}/${userId}`, "DELETE");
      showToast("User deleted successfully!", "success");
      this.loadUsers();
    } catch {
      showToast("Error deleting user", "error");
    }
  }

  async resetUserPassword(userId) {
    const newPassword = prompt("Enter new password for this user (min 8 characters):");
    if (!newPassword) return;
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }
    try {
      const resp = await this.apiCall(`${ENDPOINTS.users}/${userId}/password`, "PUT", { newPassword });
      if (resp?.otpId) {
        if (!(await this.verifyOtp("/api/users/verify/update-admin-password", resp.otpId))) return;
        showToast("Admin password updated successfully after OTP!", "success");
      } else {
        showToast("Password reset successfully!", "success");
      }
    } catch {
      showToast("Error resetting password", "error");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.admin = new AdminPanel();
});
