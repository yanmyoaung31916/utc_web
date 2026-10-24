// Central JSON + upload API client. Same behavior as AdminPanel.apiCall:
// - JSON requests send `Authorization: Bearer <token>`
// - Non-2xx responses throw `Error(error.error || ...)`
export const ENDPOINTS = {
  verify: "/api/auth/verify",
  login: "/api/auth/login",
  courses: "/api/admin/courses",
  services: "/api/admin/services",
  contact: "/api/admin/contact",
  uploadFiles: "/api/upload/files",
  uploadSingle: "/api/upload/single",
  uploadMultiple: "/api/upload/multiple",
  analytics: "/api/analytics",
  users: "/api/users",
};

export function createApiClient(getToken) {
  async function apiCall(endpoint, method = "GET", data = null) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(endpoint, options);
    if (!response.ok) {
      let message = "API call failed";
      try {
        const error = await response.json();
        message = error.error || message;
      } catch {
        // keep default message when body is not JSON
      }
      throw new Error(message);
    }
    return await response.json();
  }

  // FormData uploads intentionally omit Content-Type so the browser sets
  // the multipart boundary. Same endpoints/fields as before.
  async function uploadFormData(endpoint, formData) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    return await response.json();
  }

  function uploadSingle(file) {
    const formData = new FormData();
    formData.append("image", file);
    return uploadFormData(ENDPOINTS.uploadSingle, formData);
  }

  function uploadMultiple(files) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    return uploadFormData(ENDPOINTS.uploadMultiple, formData);
  }

  return { apiCall, uploadFormData, uploadSingle, uploadMultiple };
}
