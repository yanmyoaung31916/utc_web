// List-card templates. Same markup/classes as the original innerHTML
// renderers, with user-controlled values HTML-escaped.
import { escapeHtml } from "./dom.js";

export const emptyState = (message) =>
  `<p class="text-gray-500 text-center py-8">${escapeHtml(message)}</p>`;

export const emptyStateFull = (message) =>
  `<p class="text-gray-500 text-center py-8 col-span-full">${escapeHtml(message)}</p>`;

export function courseCard(course) {
  const outlines = course.outlines?.length ?? 0;
  return `
                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300">
                    <div class="flex flex-col md:flex-row items-start justify-between gap-2">
                        <div class="flex items-center space-x-4">
                            <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.alt)}" class="w-16 h-16 object-cover rounded-lg">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 max-w-3xl">${escapeHtml(course.title)}</h3>
                                <p class="text-sm text-gray-600">Level: ${escapeHtml(course.level)}</p>
                                <p class="text-sm text-gray-600">${outlines} topics</p>
                            </div>
                        </div>
                        <div class="flex space-x-2 items-center justify-center">
                            <button data-action="edit-course" data-id="${escapeHtml(course.id)}"
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button data-action="delete-course" data-id="${escapeHtml(course.id)}"
                                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
}

export function serviceCard(service) {
  return `
                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300">
                    <div class="flex flex-col md:flex-row items-start justify-between gap-2">
                        <div class="flex items-center space-x-4">
                            <img src="${escapeHtml(service.images?.image1)}" alt="${escapeHtml(service.title)}" class="w-16 h-16 object-cover rounded-lg">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 max-w-3xl">${escapeHtml(service.title)}</h3>
                                <p class="text-sm text-gray-600 line-clamp-2 max-w-3xl">${escapeHtml(service.description)}</p>
                            </div>
                        </div>
                        <div class="flex space-x-2  items-center justify-center">
                            <button data-action="edit-service" data-id="${escapeHtml(service.id)}"
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button data-action="delete-service" data-id="${escapeHtml(service.id)}"
                                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
}

export function mediaCard(file) {
  return `
                <div class="relative group">
                    <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.filename)}" class="w-full h-24 object-cover rounded-lg">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition duration-300 flex items-center justify-center">
                        <div class="opacity-0 group-hover:opacity-100 transition duration-300 flex space-x-2">
                            <button data-action="copy-url" data-url="${escapeHtml(file.url)}"
                                    class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button data-action="delete-media" data-id="${escapeHtml(file.filename)}"
                                    class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition duration-300">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mt-1 truncate">${escapeHtml(file.filename)}</p>
                </div>
            `;
}

export function userCard(user, currentUserId) {
  const initial = (user.firstName || user.username || "?").charAt(0).toUpperCase();
  const roleBadge =
    user.role === "admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800";
  const lastLogin = user.lastLogin
    ? `<span class="text-xs text-gray-500">
            Last login: ${escapeHtml(new Date(user.lastLogin).toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }))}
           </span>`
    : '<span class="text-xs text-gray-500">Never logged in</span>';
  const deleteBtn =
    user.id !== currentUserId
      ? `<button data-action="delete-user" data-id="${escapeHtml(user.id)}"
                class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300">
            <i class="fas fa-trash mr-1"></i>Delete
         </button>`
      : "";

  return `
                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300">
                    <div class="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div class="w-full flex md:hidden  justify-center">
                            <div class="flex w-24 h-24 bg-primary rounded-full items-center justify-center text-white font-bold">
                                ${escapeHtml(initial)}
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="hidden md:flex w-12 h-12 bg-primary rounded-full items-center justify-center text-white font-bold">
                                ${escapeHtml(initial)}
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">
                                    ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}
                                </h3>
                                <p class="text-sm text-gray-600">
                                    @${escapeHtml(user.username)}
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge}">
                                        ${user.role === "admin" ? "Admin" : "User"}
                                    </span>
                                </p>
                                <p class="text-sm text-gray-600">${escapeHtml(user.email)}</p>
                                <div class="flex items-center space-x-2 mt-1">
                                    ${lastLogin}
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col items-start gap-2 md:gap-0 md:flex-row md:space-x-2 md:items-center">
                            <button data-action="edit-user" data-id="${escapeHtml(user.id)}"
                                    class="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button data-action="reset-password" data-id="${escapeHtml(user.id)}"
                                    class="text-sm bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300">
                                <i class="fas fa-key mr-1"></i>Reset Password
                            </button>
                            ${deleteBtn}
                        </div>
                    </div>
                </div>
            `;
}
