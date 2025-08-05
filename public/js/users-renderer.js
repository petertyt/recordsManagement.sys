// User Management JavaScript
console.log("Loading users-renderer.js...");

// Check if we're in the right context
console.log("Document ready state:", document.readyState);
console.log("Window location:", window.location.href);

// Check if this script is being executed
console.log("users-renderer.js script execution started");

class UserManager {
  constructor() {
    console.log("UserManager constructor called");
    this.currentUser = null;
    this.users = [];
    this.isEditMode = false;
    this.editingUserId = null;
    this.init();
  }

  init() {
    console.log("Initializing UserManager...");
    this.bindEvents();
    this.loadUsers();
    this.loadUserStats();
  }

  bindEvents() {
    console.log("Binding events for UserManager...");

    // Add User Button
    const addUserBtn = document.getElementById("addUserBtn");
    if (addUserBtn) {
      addUserBtn.addEventListener("click", () => {
        console.log("Add user button clicked");
        this.showAddUserModal();
      });
    }

    // Save User Button
    const saveUserBtn = document.getElementById("saveUserBtn");
    if (saveUserBtn) {
      saveUserBtn.addEventListener("click", () => {
        this.saveUser();
      });
    }

    // Refresh Users Button
    const refreshUsersBtn = document.getElementById("refreshUsers");
    if (refreshUsersBtn) {
      refreshUsersBtn.addEventListener("click", () => {
        this.loadUsers();
        this.loadUserStats();
      });
    }

    // Search Users
    const userSearchInput = document.getElementById("userSearch");
    if (userSearchInput) {
      userSearchInput.addEventListener("input", (e) => {
        this.filterUsers(e.target.value);
      });
    }

    // Password Toggle Buttons
    this.setupPasswordToggles();

    // Modal Events
    this.setupModalEvents();
  }

  setupPasswordToggles() {
    const toggleButtons = [
      { button: "togglePassword", input: "password" },
      { button: "toggleConfirmPassword", input: "confirmPassword" },
      { button: "toggleNewPassword", input: "newPassword" },
      { button: "toggleConfirmNewPassword", input: "confirmNewPassword" },
    ];

    toggleButtons.forEach(({ button, input }) => {
      const btn = document.getElementById(button);
      const inputField = document.getElementById(input);

      if (btn && inputField) {
        btn.addEventListener("click", () => {
          const type = inputField.type === "password" ? "text" : "password";
          inputField.type = type;
          btn.innerHTML =
            type === "password"
              ? '<i class="bi bi-eye"></i>'
              : '<i class="bi bi-eye-slash"></i>';
        });
      }
    });
  }

  setupModalEvents() {
    // User Modal
    const userModal = document.getElementById("userModal");
    if (userModal) {
      // Handle modal hidden event
      userModal.addEventListener("hidden.bs.modal", () => {
        console.log("User modal hidden");
        this.resetUserForm();
        // Ensure modal backdrop is removed
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
          backdrop.remove();
        }
        // Remove modal-open class from body
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      });

      // Handle modal shown event
      userModal.addEventListener("shown.bs.modal", () => {
        console.log("User modal shown");
        // Focus on first input
        const firstInput = userModal.querySelector("input");
        if (firstInput) {
          firstInput.focus();
        }
      });
    }

    // Change Password Modal
    const changePasswordModal = document.getElementById("changePasswordModal");
    if (changePasswordModal) {
      changePasswordModal.addEventListener("hidden.bs.modal", () => {
        this.resetPasswordForm();
        // Ensure modal backdrop is removed
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
          backdrop.remove();
        }
        // Remove modal-open class from body
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      });
    }
  }

  async loadUsers() {
    try {
      console.log("=== LOAD USERS DEBUG START ===");
      console.log("Loading users...");

      // Clear the users array first
      this.users = [];
      console.log("Cleared users array before API call");

      const timestamp = new Date().getTime();
      const response = await fetch(
        `http://localhost:49200/api/users?_t=${timestamp}`
      );
      console.log(`Users API response status: ${response.status}`);
      const data = await response.json();
      console.log("Users API response data:", data);

      if (response.ok) {
        this.users = data.data;
        console.log("Users loaded:", this.users);
        console.log("Number of users loaded:", this.users.length);

        // Check for the specific user we're updating
        const user7 = this.users.find((u) => u.user_id === 7);
        if (user7) {
          console.log("User 7 in loaded data:", user7);
          console.log("User 7 username:", user7.username);
          console.log("User 7 full object:", JSON.stringify(user7, null, 2));
        } else {
          console.log("User 7 not found in loaded data");
        }

        // Log all users for debugging
        console.log("All users in this.users array:");
        this.users.forEach((user, index) => {
          console.log(`User ${index}:`, {
            user_id: user.user_id,
            username: user.username,
            user_role: user.user_role,
            is_active: user.is_active,
          });
        });

        console.log("About to call renderUsers()...");
        this.renderUsers();
        console.log("renderUsers() completed");
      } else {
        console.error("Failed to load users:", data.error);
        this.showError("Failed to load users: " + data.error);
      }
      console.log("=== LOAD USERS DEBUG END ===");
    } catch (error) {
      console.error("Error loading users:", error);
      this.showError("Error loading users: " + error.message);
    }
  }

  async loadUserStats() {
    try {
      const response = await fetch(
        "http://localhost:49200/api/users/stats/detailed"
      );
      const data = await response.json();

      if (response.ok) {
        const totalUsersEl = document.getElementById("totalUsers");
        const adminUsersEl = document.getElementById("adminUsers");
        const regularUsersEl = document.getElementById("regularUsers");
        const activeUsersEl = document.getElementById("activeUsers");

        if (
          !totalUsersEl ||
          !adminUsersEl ||
          !regularUsersEl ||
          !activeUsersEl
        ) {
          console.error("Some elements not found:", {
            totalUsers: !!totalUsersEl,
            adminUsers: !!adminUsersEl,
            regularUsers: !!regularUsersEl,
            activeUsers: !!activeUsersEl,
          });
          return;
        }

        if (totalUsersEl) totalUsersEl.textContent = String(data.total_users);
        if (adminUsersEl) adminUsersEl.textContent = String(data.admin_users);
        if (regularUsersEl)
          regularUsersEl.textContent = String(data.regular_users);
        if (activeUsersEl)
          activeUsersEl.textContent = String(data.active_users);
      } else {
        console.error("Failed to load user stats:", data.error);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  }

  renderUsers() {
    console.log("=== RENDER USERS DEBUG START ===");
    console.log("Rendering users...");
    console.log("this.users array length:", this.users.length);
    console.log("this.users array content:", this.users);

    const tbody = document.getElementById("usersTableBody");
    if (!tbody) {
      console.error("Users table body not found");
      return;
    }

    tbody.innerHTML = "";

    this.users.forEach((user, index) => {
      console.log(`Rendering user ${index}:`, {
        user_id: user.user_id,
        username: user.username,
        user_role: user.user_role,
        is_active: user.is_active,
        full_name: user.full_name,
        email: user.email,
        department: user.department,
      });

      const row = document.createElement("tr");
      const statusBadge =
        user.is_active === 1
          ? '<span class="badge bg-success">Active</span>'
          : '<span class="badge bg-danger">Inactive</span>';

      row.innerHTML = `
        <td>${this.escapeHtml(user.username)}</td>
        <td>${this.escapeHtml(user.full_name || "-")}</td>
        <td>${this.escapeHtml(user.department || "-")}</td>
        <td>
          <span class="badge ${
            user.user_role === "Administrator" ? "bg-primary" : "bg-secondary"
          }">
            ${this.escapeHtml(user.user_role)}
          </span>
        </td>
        <td>${statusBadge}</td>
        <td>${
          user.last_login_date ? this.formatDate(user.last_login_date) : "Never"
        }</td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" onclick="window.userManager.enhancedEditUser(${
              user.user_id
            })" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="window.userManager.changePassword(${
              user.user_id
            })" title="Change Password">
              <i class="bi bi-key"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="window.userManager.deleteUser(${
              user.user_id
            }, '${this.escapeHtml(user.username)}')" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
      console.log(
        `Row ${index} added to table for user ${user.user_id} (${user.username})`
      );
    });
    console.log("Users rendering completed");
    console.log("=== RENDER USERS DEBUG END ===");
  }

  filterUsers(searchTerm) {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");
    const term = searchTerm.toLowerCase();

    rows.forEach((row) => {
      const username = row.cells[0].textContent.toLowerCase();
      const fullName = row.cells[1].textContent.toLowerCase();
      const department = row.cells[2].textContent.toLowerCase();
      const role = row.cells[3].textContent.toLowerCase();

      if (
        username.includes(term) ||
        fullName.includes(term) ||
        department.includes(term) ||
        role.includes(term)
      ) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  showAddUserModal() {
    console.log("=== SHOW ADD USER MODAL DEBUG ===");
    console.log("showAddUserModal called");

    try {
      this.isEditMode = false;
      this.editingUserId = null;
      console.log("Set edit mode to false");

      const modalLabel = document.getElementById("userModalLabel");
      const saveBtn = document.getElementById("saveUserBtn");
      const modalElement = document.getElementById("userModal");

      console.log("Modal elements found:", {
        modalLabel: !!modalLabel,
        saveBtn: !!saveBtn,
        modalElement: !!modalElement,
      });

      if (!modalElement) {
        console.error("Modal element not found");
        this.showError("Modal element not found");
        return;
      }

      if (modalLabel) {
        modalLabel.textContent = "Add New User";
        console.log("Set modal label to 'Add New User'");
      }

      if (saveBtn) {
        saveBtn.textContent = "Save User";
        console.log("Set save button text to 'Save User'");
      }

      console.log("About to reset user form...");
      this.resetUserForm();
      console.log("User form reset completed");

      // Check if Bootstrap is available
      if (typeof bootstrap === "undefined") {
        console.error("Bootstrap is not loaded");
        this.showError("Bootstrap is not loaded");
        return;
      }
      console.log("Bootstrap is available");

      // Get existing modal instance or create new one
      let modal = bootstrap.Modal.getInstance(modalElement);
      if (!modal) {
        console.log("Creating new Bootstrap modal instance");
        modal = new bootstrap.Modal(modalElement, {
          backdrop: true,
          keyboard: true,
          focus: true,
        });
      } else {
        console.log("Using existing Bootstrap modal instance");
        // Update existing modal options
        modal._config.backdrop = true;
        modal._config.keyboard = true;
        modal._config.focus = true;
      }

      console.log("About to show modal...");

      // Ensure modal accessibility
      this.ensureModalAccessibility(modalElement);
      console.log("Modal accessibility ensured");

      modal.show();
      console.log("Modal show() called");

      // Setup focus management for the modal with a delay to ensure modal is fully loaded
      setTimeout(() => {
        console.log("Setting up modal focus after delay...");
        this.setupModalFocus(modalElement, false);
        console.log("Modal focus setup completed");

        // Check modal accessibility after setup
        this.checkModalAccessibility();
      }, 300);

      console.log("=== SHOW ADD USER MODAL DEBUG END ===");
    } catch (error) {
      console.error("Error showing add user modal:", error);
      this.showError("Error showing modal: " + error.message);
    }
  }

  async editUser(userId) {
    try {
      console.log("Edit user called for ID:", userId);
      const response = await fetch(
        `http://localhost:49200/api/users/${userId}`
      );
      const data = await response.json();

      if (response.ok) {
        this.isEditMode = true;
        this.editingUserId = userId;

        // Update modal labels
        const modalLabel = document.getElementById("userModalLabel");
        const saveBtn = document.getElementById("saveUserBtn");
        if (modalLabel) modalLabel.textContent = "Edit User";
        if (saveBtn) saveBtn.textContent = "Update User";

        // Populate form fields with explicit null checks
        const usernameElement = document.getElementById("username");
        const userRoleElement = document.getElementById("userRole");
        const fullNameElement = document.getElementById("fullName");
        const emailElement = document.getElementById("email");
        const departmentElement = document.getElementById("department");
        const phoneElement = document.getElementById("phone");

        console.log("Populating form fields with data:", data.data);

        if (usernameElement) {
          usernameElement.value = data.data.username || "";
          console.log("Set username to:", usernameElement.value);
        }
        if (userRoleElement) {
          userRoleElement.value = data.data.user_role || "";
          console.log("Set userRole to:", userRoleElement.value);
        }
        if (fullNameElement) {
          fullNameElement.value = data.data.full_name || "";
          console.log("Set fullName to:", fullNameElement.value);
        }
        if (emailElement) {
          emailElement.value = data.data.email || "";
          console.log("Set email to:", emailElement.value);
        }
        if (departmentElement) {
          departmentElement.value = data.data.department || "";
          console.log("Set department to:", departmentElement.value);
        }
        if (phoneElement) {
          phoneElement.value = data.data.phone || "";
          console.log("Set phone to:", phoneElement.value);
        }

        // Hide password fields for edit mode
        const passwordElement = document.getElementById("password");
        const confirmPasswordElement =
          document.getElementById("confirmPassword");

        if (
          passwordElement &&
          passwordElement.parentElement &&
          passwordElement.parentElement.parentElement
        ) {
          passwordElement.parentElement.parentElement.style.display = "none";
        }
        if (
          confirmPasswordElement &&
          confirmPasswordElement.parentElement &&
          confirmPasswordElement.parentElement.parentElement
        ) {
          confirmPasswordElement.parentElement.parentElement.style.display =
            "none";
        }

        console.log("Creating Bootstrap modal instance for edit");
        const modalElement = document.getElementById("userModal");

        if (!modalElement) {
          console.error("Modal element not found");
          this.showError("Modal element not found");
          return;
        }

        let modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
          modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true,
          });
        } else {
          // Update existing modal options
          modal._config.backdrop = true;
          modal._config.keyboard = true;
          modal._config.focus = true;
        }

        // Ensure modal accessibility
        this.ensureModalAccessibility(modalElement);

        // Show the modal first
        modal.show();

        // Setup focus management for the modal (edit mode)
        this.setupModalFocus(modalElement, true);

        // Test input interactivity after a delay
        setTimeout(() => {
          this.testInputInteractivity();
          this.fixInputFieldInteraction();
          this.checkForInterference();
          this.checkForOverlayIssues();
          this.manuallyTestInputInteraction();
          this.checkFormValidationIssues();
        }, 500);

        console.log("Edit user modal setup completed");
      } else {
        this.showError("Failed to load user: " + data.error);
      }
    } catch (error) {
      console.error("Error in editUser:", error);
      this.showError("Error loading user: " + error.message);
    }
  }

  async saveUser() {
    console.log("=== SAVE USER DEBUG START ===");

    // Add a small delay to ensure form is fully loaded
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Check form values before validation
    this.checkFormValues();

    if (!this.validateUserForm()) return;

    const usernameElement = document.getElementById("username");
    const userRoleElement = document.getElementById("userRole");
    const fullNameElement = document.getElementById("fullName");
    const emailElement = document.getElementById("email");
    const departmentElement = document.getElementById("department");
    const phoneElement = document.getElementById("phone");

    if (!usernameElement || !userRoleElement) {
      this.showError("Required form fields not found");
      return;
    }

    const formData = {
      username: usernameElement.value.trim(),
      user_role: userRoleElement.value,
      full_name: fullNameElement?.value?.trim() || null,
      email: emailElement?.value?.trim() || null,
      department: departmentElement?.value?.trim() || null,
      phone: phoneElement?.value?.trim() || null,
    };

    console.log("Form data being sent:", formData);
    console.log("Is edit mode:", this.isEditMode);
    console.log("Editing user ID:", this.editingUserId);

    if (!this.isEditMode) {
      const passwordElement = document.getElementById("password");
      if (passwordElement) {
        formData.password = passwordElement.value;
        console.log("Password value added to form data (validation disabled)");
      } else {
        console.error("Password element not found for new user");
        this.showError("Password field not found");
        return;
      }
    }

    try {
      this.showLoading(true);

      const url = this.isEditMode
        ? `http://localhost:49200/api/users/${this.editingUserId}`
        : "http://localhost:49200/api/users";
      const method = this.isEditMode ? "PUT" : "POST";

      console.log("Request URL:", url);
      console.log("Request method:", method);

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Backend response:", data);
      console.log("Response status:", response.status);

      if (response.ok) {
        this.showSuccess(data.message);
        const modalInstance = bootstrap.Modal.getInstance(
          document.getElementById("userModal")
        );
        if (modalInstance) {
          modalInstance.hide();
        }
        // Force immediate refresh
        console.log("About to refresh users and stats...");
        console.log("Current users before refresh:", this.users);

        // Use force complete refresh instead of regular loadUsers
        await this.forceCompleteRefresh();

        console.log("Users refreshed, now refreshing stats...");
        await this.loadUserStats();
        console.log("Users and stats refreshed after save");
        console.log("Current users after refresh:", this.users);

        // Additional verification - check if the user was actually updated
        const updatedUser = this.users.find(
          (u) => u.user_id == this.editingUserId
        );
        if (updatedUser) {
          console.log("Updated user in UI:", updatedUser);
          console.log("Updated user username:", updatedUser.username);
        } else {
          console.log("Could not find updated user in UI");
        }

        // Verify the table content
        setTimeout(() => {
          this.verifyTableContent();
        }, 100);
      } else {
        console.error("Backend error:", data.error);
        this.showError(data.error);
      }
    } catch (error) {
      console.error("Error in saveUser:", error);
      this.showError("Error saving user: " + error.message);
    } finally {
      this.showLoading(false);
    }
    console.log("=== SAVE USER DEBUG END ===");
  }

  changePassword(userId) {
    this.editingUserId = userId;
    this.showCustomPasswordChangeModal();
  }

  showCustomPasswordChangeModal() {
    // Remove any existing custom modal
    const existingModal = document.getElementById("customPasswordModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create password change modal HTML
    const modalHtml = `
      <div class="modal fade" id="customPasswordModal" tabindex="-1" aria-labelledby="customPasswordModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
              <h5 class="modal-title" id="customPasswordModalLabel">
                <i class="bi bi-key"></i> Change Password
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="passwordChangeForm">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Current Password *</label>
                  <div class="input-group">
                    <input type="password" class="form-control" id="currentPassword" required>
                    <button class="btn btn-outline-secondary" type="button" id="toggleCurrentPassword">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" id="currentPasswordError"></div>
                </div>
                <div class="mb-3">
                  <label for="newPassword" class="form-label">New Password *</label>
                  <div class="input-group">
                    <input type="password" class="form-control" id="newPassword" required>
                    <button class="btn btn-outline-secondary" type="button" id="toggleNewPassword">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                  <div class="form-text">
                    <small class="text-muted">
                      Password must be at least 8 characters long and contain:
                      <ul class="mb-0 mt-1">
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character (!@#$%^&*(),.?":{}|<>)</li>
                      </ul>
                    </small>
                  </div>
                  <div class="invalid-feedback" id="newPasswordError"></div>
                </div>
                <div class="mb-3">
                  <label for="confirmNewPassword" class="form-label">Confirm New Password *</label>
                  <div class="input-group">
                    <input type="password" class="form-control" id="confirmNewPassword" required>
                    <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" id="confirmNewPasswordError"></div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-warning" id="savePasswordBtn" onclick="event.preventDefault();">
                <i class="bi bi-check-circle"></i> Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Get modal element
    const modal = document.getElementById("customPasswordModal");
    const modalInstance = new bootstrap.Modal(modal);

    // Setup password toggles
    this.setupPasswordTogglesForModal(modal);

    // Handle form submission and button click
    const form = modal.querySelector("#passwordChangeForm");
    const saveBtn = modal.querySelector("#savePasswordBtn");
    console.log("Save button found:", saveBtn);
    console.log("Form found:", form);

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        console.log("Form submitted!");
        this.performPasswordChange(modalInstance);
      });
    }

    if (saveBtn) {
      // Add both event listener and onclick as backup
      saveBtn.addEventListener("click", (event) => {
        event.preventDefault();
        console.log("Change password button clicked (addEventListener)!");
        console.log("this context:", this);
        this.performPasswordChange(modalInstance);
      });

      // Also add onclick as backup
      saveBtn.onclick = (event) => {
        event.preventDefault();
        console.log("Change password button clicked (onclick)!");
        this.performPasswordChange(modalInstance);
      };
    } else {
      console.error("Save password button not found!");
    }

    // Handle modal hidden event
    modal.addEventListener("hidden.bs.modal", () => {
      modal.remove();
    });

    // Show modal
    modalInstance.show();
  }

  setupPasswordTogglesForModal(modal) {
    const toggles = [
      { inputId: "currentPassword", toggleId: "toggleCurrentPassword" },
      { inputId: "newPassword", toggleId: "toggleNewPassword" },
      { inputId: "confirmNewPassword", toggleId: "toggleConfirmPassword" },
    ];

    toggles.forEach(({ inputId, toggleId }) => {
      const input = modal.querySelector(`#${inputId}`);
      const toggle = modal.querySelector(`#${toggleId}`);

      if (input && toggle) {
        toggle.addEventListener("click", () => {
          const type = input.type === "password" ? "text" : "password";
          input.type = type;
          const icon = toggle.querySelector("i");
          icon.className =
            type === "password" ? "bi bi-eye" : "bi bi-eye-slash";
        });
      }
    });
  }

  async performPasswordChange(modalInstance) {
    console.log("performPasswordChange called!");
    console.log("this.editingUserId:", this.editingUserId);

    if (!this.validateCustomPasswordForm()) {
      console.log("Password validation failed!");
      return;
    }

    // Get password values from the modal
    const modal = document.getElementById("customPasswordModal");
    const currentPasswordInput = modal.querySelector("#currentPassword");
    const newPasswordInput = modal.querySelector("#newPassword");

    const currentPassword = currentPasswordInput?.value || "";
    const newPassword = newPasswordInput?.value || "";

    const formData = {
      currentPassword,
      newPassword,
    };

    console.log("Sending password change request:", {
      userId: this.editingUserId,
      currentPasswordLength: currentPassword.length,
      newPasswordLength: newPassword.length,
      formData,
    });

    try {
      this.showLoading(true);

      console.log(
        "Making API request to:",
        `http://localhost:49200/api/users/${this.editingUserId}/change-password`
      );
      console.log("Request body:", JSON.stringify(formData, null, 2));

      const response = await fetch(
        `http://localhost:49200/api/users/${this.editingUserId}/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();

      if (response.ok) {
        this.showSuccess(data.message);
        modalInstance.hide();
        // Clear the form
        this.resetCustomPasswordForm();
      } else {
        this.showError(data.error);
      }
    } catch (error) {
      this.showError("Error changing password: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  validateCustomPasswordForm() {
    console.log("validateCustomPasswordForm called!");
    let isValid = true;
    const errors = {};

    // Find the modal first
    const modal = document.getElementById("customPasswordModal");
    console.log("Modal found:", modal);

    if (!modal) {
      console.log("Modal not found!");
      return false;
    }

    // Get input elements from within the modal
    const currentPasswordInput = modal.querySelector("#currentPassword");
    const newPasswordInput = modal.querySelector("#newPassword");
    const confirmNewPasswordInput = modal.querySelector("#confirmNewPassword");

    console.log("Input elements found:", {
      currentPasswordInput: !!currentPasswordInput,
      newPasswordInput: !!newPasswordInput,
      confirmNewPasswordInput: !!confirmNewPasswordInput,
    });

    const currentPassword = currentPasswordInput?.value || "";
    const newPassword = newPasswordInput?.value || "";
    const confirmNewPassword = confirmNewPasswordInput?.value || "";

    // Clear previous errors
    this.clearCustomPasswordFormErrors();

    // Validate current password
    console.log("Current password length:", currentPassword.length);
    if (!currentPassword) {
      console.log("Current password validation failed: empty");
      errors.currentPassword = "Current password is required";
      isValid = false;
    }

    // Validate new password
    console.log("New password length:", newPassword.length);
    console.log("New password value:", newPassword);
    if (!newPassword) {
      console.log("New password validation failed: empty");
      errors.newPassword = "New password is required";
      isValid = false;
    } else {
      // Enhanced password validation
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

      console.log("Password validation checks:", {
        length: newPassword.length,
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
      });

      if (newPassword.length < minLength) {
        console.log("New password validation failed: too short");
        errors.newPassword = `Password must be at least ${minLength} characters long`;
        isValid = false;
      } else if (!hasUpperCase) {
        console.log("New password validation failed: no uppercase");
        errors.newPassword =
          "Password must contain at least one uppercase letter";
        isValid = false;
      } else if (!hasLowerCase) {
        console.log("New password validation failed: no lowercase");
        errors.newPassword =
          "Password must contain at least one lowercase letter";
        isValid = false;
      } else if (!hasNumbers) {
        console.log("New password validation failed: no numbers");
        errors.newPassword = "Password must contain at least one number";
        isValid = false;
      } else if (!hasSpecialChar) {
        console.log("New password validation failed: no special char");
        errors.newPassword =
          "Password must contain at least one special character";
        isValid = false;
      }
    }

    // Validate confirm password
    console.log("Confirm password length:", confirmNewPassword.length);
    console.log("Confirm password value:", confirmNewPassword);
    console.log("Passwords match:", newPassword === confirmNewPassword);
    if (!confirmNewPassword) {
      console.log("Confirm password validation failed: empty");
      errors.confirmNewPassword = "Please confirm your new password";
      isValid = false;
    } else if (newPassword !== confirmNewPassword) {
      console.log("Confirm password validation failed: passwords don't match");
      errors.confirmNewPassword = "Passwords do not match";
      isValid = false;
    }

    // Display errors
    Object.keys(errors).forEach((field) => {
      const errorElement = document.getElementById(field + "Error");
      if (errorElement) {
        errorElement.textContent = errors[field];
        errorElement.style.display = "block";
      }
    });

    console.log("Final validation result:", isValid);
    console.log("Validation errors:", errors);
    return isValid;
  }

  clearCustomPasswordFormErrors() {
    const errorElements = document.querySelectorAll(
      "#customPasswordModal .invalid-feedback"
    );
    errorElements.forEach((element) => {
      element.style.display = "none";
    });
  }

  resetCustomPasswordForm() {
    const form = document.getElementById("passwordChangeForm");
    if (form) {
      form.reset();
    }
    this.clearCustomPasswordFormErrors();
  }

  deleteUser(userId, username) {
    // Use custom confirmation modal instead of separate delete modal
    this.showConfirmModal(
      "Delete User",
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      async () => {
        // User confirmed deletion
        await this.performDeleteUser(userId);
      },
      () => {
        // User cancelled
        console.log("User cancelled deletion");
      }
    );
  }

  async performDeleteUser(userId) {
    try {
      this.showLoading(true);

      const response = await fetch(
        `http://localhost:49200/api/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        this.showSuccess(data.message);
        // Force immediate refresh
        await this.loadUsers();
        await this.loadUserStats();
        console.log("Users and stats refreshed after delete");
      } else {
        this.showError(data.error);
      }
    } catch (error) {
      this.showError("Error deleting user: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  async toggleUserStatus(userId, currentStatus) {
    try {
      console.log(
        `Toggling user status: userId=${userId}, currentStatus=${currentStatus}`
      );
      this.showLoading(true);
      const newStatus = currentStatus === 1 ? false : true;
      const action = newStatus ? "activate" : "deactivate";

      // Use custom confirmation modal instead of default confirm
      this.showConfirmModal(
        "Confirm Action",
        `Are you sure you want to ${action} this user?`,
        async () => {
          // Continue with the action
          console.log(
            `Making API call to update status: isActive=${newStatus}`
          );
          const response = await fetch(
            `http://localhost:49200/api/users/${userId}/status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ isActive: newStatus }),
            }
          );

          console.log(`API response status: ${response.status}`);
          const data = await response.json();
          console.log(`API response data:`, data);

          if (response.ok) {
            this.showSuccess(data.message);
            console.log(
              "Status updated successfully, reloading users and stats"
            );
            // Force immediate refresh
            await this.loadUsers();
            await this.loadUserStats();
            console.log("Users and stats refreshed after status update");
          } else {
            this.showError(data.error);
          }
        },
        () => {
          // User cancelled
          console.log("User cancelled the action");
        }
      );
      return; // Exit early since we're using async callback
    } catch (error) {
      console.error("Error updating user status:", error);
      this.showError("Error updating user status: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  validateUserForm() {
    console.log("=== VALIDATE USER FORM DEBUG ===");
    let isValid = true;
    const errors = {};

    // Username validation
    const usernameElement = document.getElementById("username");
    console.log("Username element found:", !!usernameElement);

    if (!usernameElement) {
      console.error("Username element not found");
      errors.username = "Username field not found";
      isValid = false;
    } else {
      const username = usernameElement.value;
      console.log("Username value:", username);

      if (!username || typeof username !== "string") {
        console.error("Username is empty or not a string");
        errors.username = "Username is required";
        isValid = false;
      } else {
        const trimmedUsername = username.trim();
        console.log("Trimmed username:", trimmedUsername);

        if (!trimmedUsername) {
          errors.username = "Username is required";
          isValid = false;
        } else if (trimmedUsername.length < 3) {
          errors.username = "Username must be at least 3 characters long";
          isValid = false;
        }
      }
    }

    // Role validation
    const roleElement = document.getElementById("userRole");
    console.log("Role element found:", !!roleElement);

    if (!roleElement) {
      console.error("Role element not found");
      errors.role = "Role field not found";
      isValid = false;
    } else {
      const role = roleElement.value;
      console.log("Role value:", role);

      if (!role) {
        errors.role = "Role is required";
        isValid = false;
      }
    }

    // Password validation (only for new users)
    if (!this.isEditMode) {
      console.log("Validating password for new user");
      const passwordElement = document.getElementById("password");
      const confirmPasswordElement = document.getElementById("confirmPassword");

      console.log("Password element found:", !!passwordElement);
      console.log("Confirm password element found:", !!confirmPasswordElement);

      if (!passwordElement) {
        console.error("Password element not found");
        errors.password = "Password field not found";
        isValid = false;
      } else if (!confirmPasswordElement) {
        console.error("Confirm password element not found");
        errors.confirmPassword = "Confirm password field not found";
        isValid = false;
      } else {
        const password = passwordElement.value;
        const confirmPassword = confirmPasswordElement.value;

        console.log("Password value length:", password ? password.length : 0);
        console.log(
          "Confirm password value length:",
          confirmPassword ? confirmPassword.length : 0
        );

        if (!password) {
          errors.password = "Password is required";
          isValid = false;
        } else {
          // Basic password validation - minimum length only
          const minLength = 6;

          console.log("Password validation results:", {
            length: password.length,
            minLength,
          });

          if (password.length < minLength) {
            errors.password = `Password must be at least ${minLength} characters long`;
            isValid = false;
          }
        }

        // Confirm password validation
        if (!confirmPassword) {
          errors.confirmPassword = "Please confirm your password";
          isValid = false;
        } else if (password && password !== confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
          isValid = false;
        }
      }
    } else {
      console.log("Skipping password validation for edit mode");
    }

    // Display errors
    this.clearFormErrors();
    Object.keys(errors).forEach((field) => {
      const errorElement = document.getElementById(field + "Error");
      if (errorElement) {
        errorElement.textContent = errors[field];
        errorElement.style.display = "block";
      }
    });

    console.log("Form validation result:", isValid);
    console.log("Form validation errors:", errors);
    console.log("=== VALIDATE USER FORM DEBUG END ===");
    return isValid;
  }

  validatePasswordForm() {
    let isValid = true;
    const errors = {};

    const currentPasswordElement = document.getElementById("currentPassword");
    const newPasswordElement = document.getElementById("newPassword");
    const confirmNewPasswordElement =
      document.getElementById("confirmNewPassword");

    if (!currentPasswordElement) {
      errors.currentPassword = "Current password field not found";
      isValid = false;
    } else if (!newPasswordElement) {
      errors.newPassword = "New password field not found";
      isValid = false;
    } else if (!confirmNewPasswordElement) {
      errors.confirmNewPassword = "Confirm new password field not found";
      isValid = false;
    } else {
      const currentPassword = currentPasswordElement.value;
      const newPassword = newPasswordElement.value;
      const confirmNewPassword = confirmNewPasswordElement.value;

      if (!currentPassword) {
        errors.currentPassword = "Current password is required";
        isValid = false;
      }

      if (!newPassword) {
        errors.newPassword = "New password is required";
        isValid = false;
      } else {
        // Enhanced password validation to match backend requirements
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        if (newPassword.length < minLength) {
          errors.newPassword = `Password must be at least ${minLength} characters long`;
          isValid = false;
        } else if (!hasUpperCase) {
          errors.newPassword =
            "Password must contain at least one uppercase letter";
          isValid = false;
        } else if (!hasLowerCase) {
          errors.newPassword =
            "Password must contain at least one lowercase letter";
          isValid = false;
        } else if (!hasNumbers) {
          errors.newPassword = "Password must contain at least one number";
          isValid = false;
        } else if (!hasSpecialChar) {
          errors.newPassword =
            "Password must contain at least one special character";
          isValid = false;
        }
      }
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = "Please confirm your new password";
      isValid = false;
    } else if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = "Passwords do not match";
      isValid = false;
    }

    // Display errors
    this.clearPasswordFormErrors();
    Object.keys(errors).forEach((field) => {
      const errorElement = document.getElementById(field + "Error");
      if (errorElement) {
        errorElement.textContent = errors[field];
        errorElement.style.display = "block";
      }
    });

    return isValid;
  }

  clearFormErrors() {
    const errorElements = document.querySelectorAll(".invalid-feedback");
    errorElements.forEach((element) => {
      element.style.display = "none";
    });
  }

  clearPasswordFormErrors() {
    const errorElements = document.querySelectorAll(
      "#changePasswordForm .invalid-feedback"
    );
    errorElements.forEach((element) => {
      element.style.display = "none";
    });
  }

  resetUserForm() {
    console.log("Resetting user form");

    const form = document.getElementById("userForm");
    if (form) {
      form.reset();
    }

    this.clearFormErrors();

    // Show password fields for new users
    const passwordField = document.getElementById("password");
    const confirmPasswordField = document.getElementById("confirmPassword");

    if (
      passwordField &&
      passwordField.parentElement &&
      passwordField.parentElement.parentElement
    ) {
      passwordField.parentElement.parentElement.style.display = "block";
    }

    if (
      confirmPasswordField &&
      confirmPasswordField.parentElement &&
      confirmPasswordField.parentElement.parentElement
    ) {
      confirmPasswordField.parentElement.parentElement.style.display = "block";
    }

    console.log("User form reset completed");
  }

  resetPasswordForm() {
    document.getElementById("changePasswordForm").reset();
    this.clearPasswordFormErrors();
  }

  showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.style.display = show ? "flex" : "none";
    }
  }

  showSuccess(message) {
    this.showCustomModal("Success", message, "success");
  }

  showError(message) {
    this.showCustomModal("Error", message, "error");
  }

  showConfirmModal(title, message, onConfirm, onCancel = null) {
    this.showCustomModal(title, message, "confirm", onConfirm, onCancel);
  }

  showCustomModal(
    title,
    message,
    type = "info",
    onConfirm = null,
    onCancel = null
  ) {
    // Remove any existing custom modal
    const existingModal = document.getElementById("customModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHtml = `
      <div class="modal fade" id="customModal" tabindex="-1" aria-labelledby="customModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${
              type === "error"
                ? "bg-danger text-white"
                : type === "success"
                ? "bg-success text-white"
                : "bg-primary text-white"
            }">
              <h5 class="modal-title" id="customModalLabel">
                <i class="bi ${
                  type === "error"
                    ? "bi-exclamation-triangle"
                    : type === "success"
                    ? "bi-check-circle"
                    : "bi-info-circle"
                }"></i>
                ${this.escapeHtml(title)}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">${this.escapeHtml(message)}</p>
            </div>
            <div class="modal-footer">
              ${
                type === "confirm"
                  ? `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="confirmBtn">Confirm</button>
              `
                  : `
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Get modal element
    const modal = document.getElementById("customModal");
    const modalInstance = new bootstrap.Modal(modal);

    // Handle confirm button click
    if (type === "confirm" && onConfirm) {
      const confirmBtn = modal.querySelector("#confirmBtn");
      confirmBtn.addEventListener("click", () => {
        modalInstance.hide();
        if (onConfirm) onConfirm();
      });
    }

    // Handle modal hidden event
    modal.addEventListener("hidden.bs.modal", () => {
      if (type === "confirm" && onCancel) onCancel();
      modal.remove();
    });

    // Show modal
    modalInstance.show();
  }

  // Focus management for modals
  setupModalFocus(modalElement, isEditMode = false) {
    // Remove any existing event listeners to prevent duplicates
    modalElement.removeEventListener("shown.bs.modal", this._handleModalShown);
    modalElement.removeEventListener(
      "hidden.bs.modal",
      this._handleModalHidden
    );
    modalElement.removeEventListener(
      "shown.bs.modal",
      this._handleModalShownForAccessibility
    );

    // Store handlers as instance properties so we can remove them later
    this._handleModalShown = () => {
      console.log("Modal shown event triggered, isEditMode:", isEditMode);

      // Use a more robust approach with multiple attempts
      const attemptFocus = (attempt = 1) => {
        console.log(`Focus attempt ${attempt}...`);

        // First, ensure all form fields are accessible
        const form = modalElement.querySelector("form");
        if (form) {
          const inputs = form.querySelectorAll("input, select, textarea");
          inputs.forEach((input) => {
            input.removeAttribute("disabled");
            input.removeAttribute("readonly");
            input.style.pointerEvents = "auto";
            input.style.opacity = "1";
            input.style.visibility = "visible";
            // Ensure input is not covered by other elements
            input.style.position = "relative";
            input.style.zIndex = "1";
            // Remove any problematic classes
            input.classList.remove(
              "disabled",
              "readonly",
              "form-control-disabled"
            );
          });
          console.log(`Made ${inputs.length} form fields accessible`);
        }

        // Try to focus on the first visible input field
        const focusableFields = [
          "username",
          "fullName",
          "email",
          "department",
          "userRole",
          "phone",
        ];

        console.log("Setting up modal focus, isEditMode:", isEditMode);

        let focusSuccessful = false;
        for (const fieldId of focusableFields) {
          const field = document.getElementById(fieldId);
          console.log(
            `Checking field ${fieldId}:`,
            field ? "found" : "not found"
          );

          if (
            field &&
            field.offsetParent !== null &&
            field.style.display !== "none" &&
            field.style.visibility !== "hidden"
          ) {
            // Check if element is visible and not disabled
            console.log(
              `Focusing on field: ${fieldId}, tagName: ${field.tagName}`
            );

            // Force the field to be interactive
            field.removeAttribute("disabled");
            field.removeAttribute("readonly");
            field.style.pointerEvents = "auto";
            field.style.opacity = "1";
            field.style.visibility = "visible";

            // Try to focus the field
            try {
              field.focus();

              // Verify focus was successful
              if (document.activeElement === field) {
                console.log(`Successfully focused on field: ${fieldId}`);
                focusSuccessful = true;

                if (isEditMode && field.value && field.tagName === "INPUT") {
                  // Only call select() on input elements, not select elements
                  try {
                    field.select();
                    console.log(`Selected text in field: ${fieldId}`);
                  } catch (error) {
                    console.log(
                      `Could not select text in field ${fieldId}:`,
                      error.message
                    );
                  }
                }
                break;
              } else {
                console.log(`Focus failed for field: ${fieldId}`);
              }
            } catch (error) {
              console.log(`Error focusing field ${fieldId}:`, error.message);
            }
          }
        }

        // If focus failed and we haven't exceeded attempts, try again
        if (!focusSuccessful && attempt < 3) {
          console.log(`Focus attempt ${attempt} failed, retrying in 100ms...`);
          setTimeout(() => attemptFocus(attempt + 1), 100);
        } else if (!focusSuccessful) {
          console.warn("All focus attempts failed");
        }
      };

      // Start with a longer delay to ensure modal is fully rendered
      setTimeout(() => attemptFocus(), 300);
    };

    this._handleModalHidden = () => {
      console.log("Modal hidden event triggered");
      // Reset form when modal is hidden
      this.resetUserForm();
    };

    this._handleModalShownForAccessibility = () => {
      console.log("Modal accessibility event triggered");
      // Additional accessibility setup
      const form = modalElement.querySelector("form");
      if (form) {
        const inputs = form.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          input.removeAttribute("disabled");
          input.removeAttribute("readonly");
          input.style.pointerEvents = "auto";
          input.style.opacity = "1";
          input.style.visibility = "visible";
        });
        console.log(
          `Additional accessibility setup for ${inputs.length} form fields`
        );
      }

      // Ensure modal backdrop doesn't interfere
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.style.pointerEvents = "none";
        backdrop.style.zIndex = "1040";
        console.log("Modal backdrop configured to not interfere");
      }

      // Ensure modal itself has proper z-index
      modalElement.style.zIndex = "1050";
    };

    // Add event listeners
    modalElement.addEventListener("shown.bs.modal", this._handleModalShown);
    modalElement.addEventListener("hidden.bs.modal", this._handleModalHidden);
    modalElement.addEventListener(
      "shown.bs.modal",
      this._handleModalShownForAccessibility
    );
  }

  // Check for form validation issues
  checkFormValidationIssues() {
    console.log("Checking for form validation issues...");

    const form = document.getElementById("userForm");
    if (!form) {
      console.error("User form not found");
      return;
    }

    // Check if form has any validation attributes that might interfere
    console.log("Form validation attributes:", {
      novalidate: form.hasAttribute("novalidate"),
      action: form.action,
      method: form.method,
    });

    // Check individual inputs for validation attributes
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      console.log(`Input ${input.id} validation:`, {
        required: input.hasAttribute("required"),
        pattern: input.getAttribute("pattern"),
        minlength: input.getAttribute("minlength"),
        maxlength: input.getAttribute("maxlength"),
        readonly: input.hasAttribute("readonly"),
        disabled: input.hasAttribute("disabled"),
      });

      // Remove any problematic validation attributes temporarily
      if (input.hasAttribute("readonly")) {
        console.warn(`Removing readonly attribute from ${input.id}`);
        input.removeAttribute("readonly");
      }

      if (input.hasAttribute("disabled")) {
        console.warn(`Removing disabled attribute from ${input.id}`);
        input.removeAttribute("disabled");
      }
    });

    // Check for any global form validation
    if (typeof window.FormData !== "undefined") {
      try {
        const formData = new FormData(form);
        console.log("FormData created successfully");
      } catch (error) {
        console.error("Error creating FormData:", error);
      }
    }
  }

  // Manually test input interaction
  manuallyTestInputInteraction() {
    console.log("Manually testing input interaction...");

    const form = document.getElementById("userForm");
    if (!form) {
      console.error("User form not found");
      return;
    }

    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      console.log(`Testing input ${input.id}...`);

      // Try to programmatically focus
      try {
        input.focus();
        console.log(`✓ Successfully focused ${input.id}`);
      } catch (error) {
        console.error(`✗ Failed to focus ${input.id}:`, error);
      }

      // Try to programmatically set value
      if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
        const originalValue = input.value;
        try {
          input.value = "test_value";
          if (input.value === "test_value") {
            console.log(`✓ Successfully set value for ${input.id}`);
          } else {
            console.error(`✗ Failed to set value for ${input.id}`);
          }
          input.value = originalValue;
        } catch (error) {
          console.error(`✗ Error setting value for ${input.id}:`, error);
        }
      }

      // Try to trigger input event
      try {
        const inputEvent = new Event("input", { bubbles: true });
        input.dispatchEvent(inputEvent);
        console.log(`✓ Successfully triggered input event for ${input.id}`);
      } catch (error) {
        console.error(
          `✗ Failed to trigger input event for ${input.id}:`,
          error
        );
      }

      // Try to trigger click event
      try {
        const clickEvent = new Event("click", { bubbles: true });
        input.dispatchEvent(clickEvent);
        console.log(`✓ Successfully triggered click event for ${input.id}`);
      } catch (error) {
        console.error(
          `✗ Failed to trigger click event for ${input.id}:`,
          error
        );
      }
    });
  }

  // Check for overlay issues
  checkForOverlayIssues() {
    console.log("Checking for overlay issues...");

    // Check modal backdrop
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop) {
      console.log("Modal backdrop found:", {
        pointerEvents: backdrop.style.pointerEvents,
        zIndex: backdrop.style.zIndex,
        position: backdrop.style.position,
      });

      // Ensure backdrop doesn't interfere
      backdrop.style.pointerEvents = "none";
      backdrop.style.zIndex = "1040";
    }

    // Check for any elements that might be covering the form
    const modal = document.getElementById("userModal");
    if (modal) {
      const form = modal.querySelector("form");
      if (form) {
        const formRect = form.getBoundingClientRect();
        console.log("Form position:", formRect);

        // Check if any elements are covering the form
        const allElements = document.querySelectorAll("*");
        allElements.forEach((element) => {
          if (element !== form && !form.contains(element)) {
            const elementRect = element.getBoundingClientRect();

            // Check if element overlaps with form
            if (
              elementRect.left < formRect.right &&
              elementRect.right > formRect.left &&
              elementRect.top < formRect.bottom &&
              elementRect.bottom > formRect.top
            ) {
              if (element.style.pointerEvents !== "none") {
                console.warn("Element overlapping form:", element, {
                  pointerEvents: element.style.pointerEvents,
                  zIndex: element.style.zIndex,
                });
              }
            }
          }
        });
      }
    }
  }

  // Check for JavaScript interference
  checkForInterference() {
    console.log("Checking for JavaScript interference...");

    // Check if Bootstrap is interfering
    if (typeof bootstrap !== "undefined") {
      console.log("Bootstrap is loaded");

      // Check if there are any Bootstrap event listeners that might interfere
      const modal = document.getElementById("userModal");
      if (modal) {
        console.log("Modal found, checking for interference...");
        // Note: getEventListeners is only available in Chrome DevTools
        // We'll use a different approach to check for interference
        const modalEvents = modal._events || "No direct event access";
        console.log("Modal event listeners:", modalEvents);
      }
    }

    // Check if jQuery is interfering
    if (typeof $ !== "undefined") {
      console.log("jQuery is loaded");

      // Check if jQuery has any disabled inputs
      const disabledInputs = $(
        "input:disabled, select:disabled, textarea:disabled"
      );
      if (disabledInputs.length > 0) {
        console.warn("Found disabled inputs via jQuery:", disabledInputs);
        disabledInputs.prop("disabled", false);
      }
    }

    // Check for any global event listeners that might prevent input
    const form = document.getElementById("userForm");
    if (form) {
      const inputs = form.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        // Check if input has any event listeners that prevent default
        console.log(`Input ${input.id} properties:`, {
          disabled: input.disabled,
          readonly: input.readOnly,
          type: input.type,
          value: input.value,
          style: {
            pointerEvents: input.style.pointerEvents,
            opacity: input.style.opacity,
            visibility: input.style.visibility,
            display: input.style.display,
          },
        });
      });
    }
  }

  // Manually fix input field interaction issues
  fixInputFieldInteraction() {
    console.log("Attempting to fix input field interaction issues...");

    const form = document.getElementById("userForm");
    if (!form) {
      console.error("User form not found");
      return;
    }

    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      // Force enable the input
      input.disabled = false;
      input.readOnly = false;

      // Remove any problematic styles
      input.style.pointerEvents = "auto";
      input.style.opacity = "1";
      input.style.visibility = "visible";
      input.style.display = "";
      input.style.position = "relative";
      input.style.zIndex = "1";

      // Remove any problematic classes
      input.classList.remove("disabled", "readonly", "form-control-disabled");

      // Ensure input can receive events
      input.style.userSelect = "auto";
      input.style.webkitUserSelect = "auto";
      input.style.mozUserSelect = "auto";
      input.style.msUserSelect = "auto";

      // Add event listeners to test interaction
      input.addEventListener("focus", () => {
        console.log(`Input ${input.id} received focus`);
      });

      input.addEventListener("input", () => {
        console.log(`Input ${input.id} received input:`, input.value);
      });

      input.addEventListener("click", () => {
        console.log(`Input ${input.id} was clicked`);
      });

      console.log(`Fixed input ${input.id}:`, {
        disabled: input.disabled,
        readonly: input.readOnly,
        pointerEvents: input.style.pointerEvents,
        opacity: input.style.opacity,
      });
    });

    // Also check for any overlaying elements
    const modal = document.getElementById("userModal");
    if (modal) {
      const overlays = modal.querySelectorAll("*");
      overlays.forEach((element) => {
        if (element.style.pointerEvents === "none") {
          console.warn("Found element with pointer-events: none:", element);
          element.style.pointerEvents = "auto";
        }
      });
    }
  }

  // Test input field interactivity
  testInputInteractivity() {
    console.log("Testing input field interactivity...");
    const form = document.getElementById("userForm");
    if (!form) {
      console.error("User form not found");
      return;
    }

    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input, index) => {
      console.log(`Input ${index + 1}:`, {
        id: input.id,
        type: input.type,
        tagName: input.tagName,
        disabled: input.disabled,
        readonly: input.readOnly,
        value: input.value,
        style: {
          pointerEvents: input.style.pointerEvents,
          opacity: input.style.opacity,
          visibility: input.style.visibility,
          display: input.style.display,
          position: input.style.position,
          zIndex: input.style.zIndex,
        },
        offsetParent: input.offsetParent,
        offsetWidth: input.offsetWidth,
        offsetHeight: input.offsetHeight,
      });

      // Test if input can receive focus
      try {
        input.focus();
        console.log(`✓ Input ${input.id} can receive focus`);
      } catch (error) {
        console.error(`✗ Input ${input.id} cannot receive focus:`, error);
      }

      // Test if input can receive input
      if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
        const originalValue = input.value;
        input.value = "test";
        if (input.value === "test") {
          console.log(`✓ Input ${input.id} can receive input`);
        } else {
          console.error(`✗ Input ${input.id} cannot receive input`);
        }
        input.value = originalValue;
      }
    });
  }

  // Ensure modal is accessible and properly configured
  ensureModalAccessibility(modalElement) {
    console.log("Ensuring modal accessibility");

    // Ensure modal has proper ARIA attributes
    modalElement.setAttribute("aria-modal", "true");
    modalElement.setAttribute("role", "dialog");
    modalElement.setAttribute("tabindex", "-1");

    // Find all focusable elements and ensure they're properly configured
    const focusableElements = modalElement.querySelectorAll(
      "input, select, textarea"
    );
    focusableElements.forEach((element, index) => {
      // Set tabindex for keyboard navigation
      element.setAttribute("tabindex", index === 0 ? "0" : "-1");

      // Ensure elements are not disabled
      element.removeAttribute("disabled");
      element.removeAttribute("readonly");

      // Ensure elements are visible and interactive
      element.style.pointerEvents = "auto";
      element.style.opacity = "1";
      element.style.visibility = "visible";
      element.style.position = "relative";
      element.style.zIndex = "1";

      // Remove any CSS classes that might disable the element
      element.classList.remove("disabled", "readonly");

      // Ensure input elements can receive focus and input
      if (
        element.tagName === "INPUT" ||
        element.tagName === "SELECT" ||
        element.tagName === "TEXTAREA"
      ) {
        element.style.userSelect = "auto";
        element.style.webkitUserSelect = "auto";
        element.style.mozUserSelect = "auto";
        element.style.msUserSelect = "auto";
      }

      console.log(`Configured element ${element.id || element.tagName}:`, {
        tagName: element.tagName,
        type: element.type,
        disabled: element.disabled,
        readonly: element.readOnly,
        pointerEvents: element.style.pointerEvents,
        opacity: element.style.opacity,
      });
    });

    console.log(
      `Configured ${focusableElements.length} focusable elements in modal`
    );

    // Also ensure the modal backdrop doesn't interfere
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.style.pointerEvents = "none";
      backdrop.style.zIndex = "1040";
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  forceRefresh() {
    console.log("=== FORCE REFRESH DEBUG ===");
    console.log("Forcing complete refresh...");

    // Clear the users array
    this.users = [];
    console.log("Cleared users array");

    // Clear the table body
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
      tbody.innerHTML = "";
      console.log("Cleared table body");
    }

    // Reload users
    this.loadUsers();
    console.log("=== FORCE REFRESH DEBUG END ===");
  }

  verifyTableContent() {
    console.log("=== VERIFY TABLE CONTENT DEBUG ===");
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) {
      console.error("Table body not found");
      return;
    }

    const rows = tbody.querySelectorAll("tr");
    console.log("Number of rows in table:", rows.length);

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 2) {
        const userId = cells[0].textContent;
        const username = cells[1].textContent;
        console.log(
          `Row ${index}: User ID = ${userId}, Username = ${username}`
        );
      }
    });
    console.log("=== VERIFY TABLE CONTENT DEBUG END ===");
  }

  // Add this method for testing
  async testUpdateUser(userId, newUsername) {
    console.log("=== TEST UPDATE USER ===");
    console.log(`Testing update of user ${userId} to username: ${newUsername}`);

    try {
      const response = await fetch(
        `http://localhost:49200/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: newUsername,
            user_role: "User",
          }),
        }
      );

      const data = await response.json();
      console.log("Test update response:", data);

      if (response.ok) {
        console.log("Test update successful");
        // Force refresh
        this.forceRefresh();
      } else {
        console.error("Test update failed:", data.error);
      }
    } catch (error) {
      console.error("Test update error:", error);
    }

    console.log("=== TEST UPDATE USER END ===");
  }

  // Add this method to test API calls manually
  async testAPICall() {
    console.log("=== TEST API CALL ===");
    try {
      const timestamp = new Date().getTime();
      console.log("Making API call with timestamp:", timestamp);

      const response = await fetch(
        `http://localhost:49200/api/users?_t=${timestamp}`
      );
      console.log("API Response status:", response.status);

      const data = await response.json();
      console.log("API Response data:", data);

      // Check for user 7 specifically
      const user7 = data.data.find((u) => u.user_id === 7);
      if (user7) {
        console.log("User 7 in API response:", user7);
        console.log("User 7 username:", user7.username);
      } else {
        console.log("User 7 not found in API response");
      }

      return data;
    } catch (error) {
      console.error("API call error:", error);
      return null;
    }
  }

  // Add this method to force a complete page refresh
  forcePageRefresh() {
    console.log("=== FORCE PAGE REFRESH ===");
    console.log("Reloading the entire page...");
    window.location.reload();
  }

  // Add this method to completely clear and re-render
  async forceCompleteRefresh() {
    console.log("=== FORCE COMPLETE REFRESH ===");

    // Clear users array
    this.users = [];
    console.log("1. Cleared users array");

    // Clear table body
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
      tbody.innerHTML = "";
      console.log("2. Cleared table body");
    }

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log("3. Waited 100ms");

    // Test API call first
    const apiData = await this.testAPICall();
    console.log("4. API test completed");

    // Load users
    await this.loadUsers();
    console.log("5. Users loaded");

    // Verify table content
    this.verifyTableContent();
    console.log("6. Table content verified");

    console.log("=== FORCE COMPLETE REFRESH END ===");
  }

  // Add this method to test user creation step by step
  async testUserCreation() {
    console.log("=== TEST USER CREATION ===");

    try {
      // Step 1: Test form validation
      console.log("Step 1: Testing form validation...");
      const isValid = this.validateUserForm();
      console.log("Form validation result:", isValid);

      if (!isValid) {
        console.log("Form validation failed, stopping test");
        return;
      }

      // Step 2: Get form data
      console.log("Step 2: Getting form data...");
      const usernameElement = document.getElementById("username");
      const userRoleElement = document.getElementById("userRole");
      const passwordElement = document.getElementById("password");

      if (!usernameElement || !userRoleElement || !passwordElement) {
        console.error("Required form elements not found:", {
          username: !!usernameElement,
          userRole: !!userRoleElement,
          password: !!passwordElement,
        });
        return;
      }

      const formData = {
        username: usernameElement.value.trim(),
        password: passwordElement.value,
        user_role: userRoleElement.value,
      };

      console.log("Form data to be sent:", formData);

      // Step 3: Test API call
      console.log("Step 3: Testing API call...");
      const response = await fetch("http://localhost:49200/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("API Response status:", response.status);
      console.log("API Response data:", data);

      if (response.ok) {
        console.log("User creation successful!");
        // Refresh the users list
        await this.forceCompleteRefresh();
      } else {
        console.error("User creation failed:", data.error);
      }
    } catch (error) {
      console.error("Error in testUserCreation:", error);
    }

    console.log("=== TEST USER CREATION END ===");
  }

  // Add this method to manually save user with current form values
  async manualSaveUser() {
    console.log("=== MANUAL SAVE USER ===");

    try {
      // Get form values directly
      const usernameElement = document.getElementById("username");
      const userRoleElement = document.getElementById("userRole");
      const passwordElement = document.getElementById("password");
      const fullNameElement = document.getElementById("fullName");
      const emailElement = document.getElementById("email");
      const departmentElement = document.getElementById("department");
      const phoneElement = document.getElementById("phone");

      if (!usernameElement || !userRoleElement || !passwordElement) {
        console.error("Required elements not found");
        return;
      }

      const formData = {
        username: usernameElement.value.trim(),
        password: passwordElement.value,
        user_role: userRoleElement.value,
        full_name: fullNameElement?.value?.trim() || null,
        email: emailElement?.value?.trim() || null,
        department: departmentElement?.value?.trim() || null,
        phone: phoneElement?.value?.trim() || null,
      };

      console.log("Manual form data:", formData);

      // Make API call directly
      const response = await fetch("http://localhost:49200/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Manual save response:", data);

      if (response.ok) {
        console.log("Manual save successful!");
        this.showSuccess("User created successfully!");
        // Refresh the users list
        await this.forceCompleteRefresh();
      } else {
        console.error("Manual save failed:", data.error);
        this.showError(data.error);
      }
    } catch (error) {
      console.error("Error in manual save:", error);
      this.showError("Error saving user: " + error.message);
    }

    console.log("=== MANUAL SAVE USER END ===");
  }

  // Add this method to manually trigger form validation with delay
  async delayedValidateAndSave() {
    console.log("=== DELAYED VALIDATE AND SAVE ===");

    // Wait a moment for form to be fully loaded
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check form values first
    this.checkFormValues();

    // Try validation
    const isValid = this.validateUserForm();
    console.log("Delayed validation result:", isValid);

    if (isValid) {
      console.log("Validation passed, proceeding with save...");
      await this.saveUser();
    } else {
      console.log("Validation failed, stopping save process");
    }

    console.log("=== DELAYED VALIDATE AND SAVE END ===");
  }

  // Add this method to bypass validation and save directly
  async bypassValidationAndSave() {
    console.log("=== BYPASS VALIDATION AND SAVE ===");

    try {
      // Get form values directly without validation
      const usernameElement = document.getElementById("username");
      const userRoleElement = document.getElementById("userRole");
      const passwordElement = document.getElementById("password");
      const fullNameElement = document.getElementById("fullName");
      const emailElement = document.getElementById("email");
      const departmentElement = document.getElementById("department");
      const phoneElement = document.getElementById("phone");

      console.log("Form elements found:", {
        username: !!usernameElement,
        userRole: !!userRoleElement,
        password: !!passwordElement,
      });

      if (!usernameElement || !userRoleElement || !passwordElement) {
        console.error("Required elements not found");
        this.showError("Required form fields not found");
        return;
      }

      const formData = {
        username: usernameElement.value.trim(),
        password: passwordElement.value,
        user_role: userRoleElement.value,
        full_name: fullNameElement?.value?.trim() || null,
        email: emailElement?.value?.trim() || null,
        department: departmentElement?.value?.trim() || null,
        phone: phoneElement?.value?.trim() || null,
      };

      console.log("Bypass form data:", formData);

      // Make API call directly
      const response = await fetch("http://localhost:49200/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Bypass save response:", data);

      if (response.ok) {
        console.log("Bypass save successful!");
        this.showSuccess("User created successfully!");
        // Close modal
        const modalInstance = bootstrap.Modal.getInstance(
          document.getElementById("userModal")
        );
        if (modalInstance) {
          modalInstance.hide();
        }
        // Refresh the users list
        await this.forceCompleteRefresh();
      } else {
        console.error("Bypass save failed:", data.error);
        this.showError(data.error);
      }
    } catch (error) {
      console.error("Error in bypass save:", error);
      this.showError("Error saving user: " + error.message);
    }

    console.log("=== BYPASS VALIDATION AND SAVE END ===");
  }

  // Add this method to the UserManager class
  debug() {
    console.log("=== USERMANAGER DEBUG ===");
    console.log("UserManager instance:", this);
    console.log("Users array:", this.users);
    console.log("Users array length:", this.users.length);
    console.log("Is edit mode:", this.isEditMode);
    console.log("Editing user ID:", this.editingUserId);

    // Check for user 7 specifically
    const user7 = this.users.find((u) => u.user_id === 7);
    if (user7) {
      console.log("User 7 found:", user7);
      console.log("User 7 username:", user7.username);
    } else {
      console.log("User 7 not found in users array");
    }

    // Check DOM
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
      const rows = tbody.querySelectorAll("tr");
      console.log("Number of rows in DOM:", rows.length);

      rows.forEach((row, index) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
          const userId = cells[0].textContent;
          const username = cells[1].textContent;
          console.log(
            `DOM Row ${index}: User ID = ${userId}, Username = ${username}`
          );
        }
      });
    } else {
      console.log("Table body not found in DOM");
    }

    console.log("=== USERMANAGER DEBUG END ===");
  }

  // Add this method to check modal accessibility
  checkModalAccessibility() {
    console.log("=== CHECK MODAL ACCESSIBILITY ===");

    const modalElement = document.getElementById("userModal");
    console.log("Modal element found:", !!modalElement);

    if (modalElement) {
      console.log("Modal is visible:", modalElement.style.display !== "none");
      console.log("Modal classes:", modalElement.className);
    }

    // Check all form elements
    const formElements = {
      username: document.getElementById("username"),
      userRole: document.getElementById("userRole"),
      password: document.getElementById("password"),
      confirmPassword: document.getElementById("confirmPassword"),
      fullName: document.getElementById("fullName"),
      email: document.getElementById("email"),
      department: document.getElementById("department"),
      phone: document.getElementById("phone"),
    };

    console.log("Form elements found:");
    Object.entries(formElements).forEach(([name, element]) => {
      console.log(`  ${name}:`, !!element);
      if (element) {
        console.log(`    - Visible:`, element.style.display !== "none");
        console.log(`    - Disabled:`, element.disabled);
        console.log(`    - Readonly:`, element.readOnly);
        console.log(`    - Value:`, element.value);
      }
    });

    // Check if form is accessible
    const form = document.getElementById("userForm");
    console.log("Form element found:", !!form);

    console.log("=== CHECK MODAL ACCESSIBILITY END ===");
  }

  // Add this method to manually check form values
  checkFormValues() {
    console.log("=== CHECK FORM VALUES ===");

    const formElements = {
      username: document.getElementById("username"),
      userRole: document.getElementById("userRole"),
      password: document.getElementById("password"),
      confirmPassword: document.getElementById("confirmPassword"),
      fullName: document.getElementById("fullName"),
      email: document.getElementById("email"),
      department: document.getElementById("department"),
      phone: document.getElementById("phone"),
    };

    console.log("Current form values:");
    Object.entries(formElements).forEach(([name, element]) => {
      if (element) {
        const value = element.value;
        const type = element.type;
        const tagName = element.tagName;
        console.log(`  ${name}:`, {
          value: value,
          type: type,
          tagName: tagName,
          length: value ? value.length : 0,
          trimmed: value ? value.trim() : "",
          trimmedLength: value ? value.trim().length : 0,
        });
      } else {
        console.log(`  ${name}: element not found`);
      }
    });

    // Check if passwords match
    const password = formElements.password?.value || "";
    const confirmPassword = formElements.confirmPassword?.value || "";
    console.log("Password comparison:", {
      password: password,
      confirmPassword: confirmPassword,
      match: password === confirmPassword,
      passwordLength: password.length,
      confirmPasswordLength: confirmPassword.length,
    });

    console.log("=== CHECK FORM VALUES END ===");
  }

  async enhancedEditUser(userId) {
    console.log("=== ENHANCED EDIT USER DEBUG ===");
    console.log("Enhanced edit user called for ID:", userId);

    try {
      // Fetch user details
      const response = await fetch(
        `http://localhost:49200/api/users/${userId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Fetched user data:", responseData);

      // Extract user data from the response
      const user = responseData.data;
      if (!user) {
        throw new Error("No user data received from server");
      }

      // Show enhanced edit modal with all user details
      this.showEnhancedEditModal(user);
    } catch (error) {
      console.error("Error in enhancedEditUser:", error);
      this.showError("Failed to load user details");
    }
  }

  showEnhancedEditModal(user) {
    console.log("=== SHOW ENHANCED EDIT MODAL DEBUG ===");
    console.log("Showing enhanced edit modal for user:", user);

    // Create modal HTML with all user details and action buttons
    const modalHtml = `
      <div class="modal fade" id="enhancedEditModal" tabindex="-1" aria-labelledby="enhancedEditModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="enhancedEditModalLabel">
                <i class="bi bi-pencil-square"></i> Edit User: ${this.escapeHtml(
                  user.username
                )}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="text-primary mb-3">User Information</h6>
                  <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" id="enhanced-username" value="${this.escapeHtml(
                      user.username
                    )}">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="enhanced-full-name" value="${this.escapeHtml(
                      user.full_name || ""
                    )}">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="enhanced-email" value="${this.escapeHtml(
                      user.email || ""
                    )}">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Department</label>
                    <input type="text" class="form-control" id="enhanced-department" value="${this.escapeHtml(
                      user.department || ""
                    )}">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control" id="enhanced-phone" value="${this.escapeHtml(
                      user.phone || ""
                    )}">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Role</label>
                    <select class="form-select" id="enhanced-user-role">
                      <option value="User" ${
                        user.user_role === "User" ? "selected" : ""
                      }>User</option>
                      <option value="Administrator" ${
                        user.user_role === "Administrator" ? "selected" : ""
                      }>Administrator</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6 class="text-info mb-3">Account Details</h6>
                  <div class="mb-3">
                    <label class="form-label">User ID</label>
                    <input type="text" class="form-control" value="${
                      user.user_id
                    }" readonly>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Status</label>
                    <div class="d-flex align-items-center">
                      <span class="badge ${
                        user.is_active === 1 ? "bg-success" : "bg-danger"
                      } me-2">
                        ${user.is_active === 1 ? "Active" : "Inactive"}
                      </span>
                      <button class="btn btn-sm ${
                        user.is_active === 1 ? "btn-warning" : "btn-success"
                      }" 
                              onclick="window.userManager.toggleUserStatusFromEnhanced(${
                                user.user_id
                              }, ${user.is_active})">
                        ${user.is_active === 1 ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Created Date</label>
                    <input type="text" class="form-control" value="${this.formatDate(
                      user.user_creation_date
                    )}" readonly>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Last Login</label>
                    <input type="text" class="form-control" value="${
                      user.last_login_date
                        ? this.formatDate(user.last_login_date)
                        : "Never"
                    }" readonly>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Actions</label>
                    <div class="d-grid gap-2">
                      <button class="btn btn-warning btn-sm" onclick="window.userManager.changePasswordFromEnhanced(${
                        user.user_id
                      })">
                        <i class="bi bi-key"></i> Change Password
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="window.userManager.deleteUserFromEnhanced(${
                        user.user_id
                      }, '${this.escapeHtml(user.username)}')">
                        <i class="bi bi-trash"></i> Delete User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="window.userManager.saveEnhancedUser(${
                user.user_id
              })">
                <i class="bi bi-check"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById("enhancedEditModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Show modal
    const modal = new bootstrap.Modal(
      document.getElementById("enhancedEditModal")
    );
    modal.show();

    console.log("Enhanced edit modal displayed");
    console.log("=== SHOW ENHANCED EDIT MODAL DEBUG END ===");
  }

  async saveEnhancedUser(userId) {
    console.log("=== SAVE ENHANCED USER DEBUG ===");
    console.log("Saving enhanced user with ID:", userId);

    try {
      const userData = {
        username: document.getElementById("enhanced-username").value,
        full_name: document.getElementById("enhanced-full-name").value,
        email: document.getElementById("enhanced-email").value,
        department: document.getElementById("enhanced-department").value,
        phone: document.getElementById("enhanced-phone").value,
        user_role: document.getElementById("enhanced-user-role").value,
      };

      console.log("User data to save:", userData);

      const response = await fetch(
        `http://localhost:49200/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      const result = await response.json();
      console.log("Update result:", result);

      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("enhancedEditModal")
      );
      modal.hide();

      // Refresh user list
      await this.loadUsers();
      this.showSuccess("User updated successfully");
    } catch (error) {
      console.error("Error saving enhanced user:", error);
      this.showError(error.message);
    }
  }

  toggleUserStatusFromEnhanced(userId, currentStatus) {
    console.log("Toggle status from enhanced modal:", userId, currentStatus);
    this.toggleUserStatus(userId, currentStatus);
  }

  changePasswordFromEnhanced(userId) {
    console.log("Change password from enhanced modal:", userId);
    // Close enhanced modal first
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("enhancedEditModal")
    );
    modal.hide();
    // Then open password change modal
    this.changePassword(userId);
  }

  deleteUserFromEnhanced(userId, username) {
    console.log("Delete user from enhanced modal:", userId, username);
    // Close enhanced modal first
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("enhancedEditModal")
    );
    modal.hide();
    // Then open delete confirmation
    this.deleteUser(userId, username);
  }
}

// Global function for testing
window.forceUserRefresh = function () {
  if (window.userManager) {
    console.log("Manually triggering user refresh...");
    window.userManager.forceRefresh();
  } else {
    console.error("userManager not available");
  }
};

// Global function to check current users
window.checkCurrentUsers = function () {
  if (window.userManager) {
    console.log("Current users in userManager:", window.userManager.users);
    window.userManager.verifyTableContent();
  } else {
    console.error("userManager not available");
  }
};

// Global function to debug UserManager
window.debugUserManager = function () {
  if (window.userManager) {
    window.userManager.debug();
  } else {
    console.error("userManager not available");
  }
};

// Global function to test user update
window.testUpdateUser = function (userId, newUsername) {
  if (window.userManager) {
    window.userManager.testUpdateUser(userId, newUsername);
  } else {
    console.error("userManager not available");
  }
};

// Global function to test API call
window.testAPICall = function () {
  if (window.userManager) {
    window.userManager.testAPICall();
  } else {
    console.error("userManager not available");
  }
};

// Global function to force page refresh
window.forcePageRefresh = function () {
  if (window.userManager) {
    window.userManager.forcePageRefresh();
  } else {
    console.error("userManager not available");
  }
};

// Global function to force complete refresh
window.forceCompleteRefresh = function () {
  if (window.userManager) {
    window.userManager.forceCompleteRefresh();
  } else {
    console.error("userManager not available");
  }
};

// Global function to test user creation
window.testUserCreation = function () {
  if (window.userManager) {
    window.userManager.testUserCreation();
  } else {
    console.error("userManager not available");
  }
};

// Global function to check modal accessibility
window.checkModalAccessibility = function () {
  if (window.userManager) {
    window.userManager.checkModalAccessibility();
  } else {
    console.error("userManager not available");
  }
};

// Global function to check form values
window.checkFormValues = function () {
  if (window.userManager) {
    window.userManager.checkFormValues();
  } else {
    console.error("userManager not available");
  }
};

// Global function to manually save user
window.manualSaveUser = function () {
  if (window.userManager) {
    window.userManager.manualSaveUser();
  } else {
    console.error("userManager not available");
  }
};

// Global function to delayed validate and save
window.delayedValidateAndSave = function () {
  if (window.userManager) {
    window.userManager.delayedValidateAndSave();
  } else {
    console.error("userManager not available");
  }
};

// Global function to bypass validation and save
window.bypassValidationAndSave = function () {
  if (window.userManager) {
    window.userManager.bypassValidationAndSave();
  } else {
    console.error("userManager not available");
  }
};

// Create and initialize the UserManager instance
const userManager = new UserManager();

// Make it globally available
window.UserManager = UserManager;
window.userManager = userManager;

// Bind delete confirmation
document.getElementById("confirmDeleteBtn")?.addEventListener("click", () => {
  if (window.userManager) {
    window.userManager.confirmDelete();
  }
});

// Bind password save
document.getElementById("savePasswordBtn")?.addEventListener("click", () => {
  if (window.userManager) {
    window.userManager.savePassword();
  }
});

console.log("UserManager initialized and made globally available");
console.log(
  "Available global functions: forceUserRefresh(), checkCurrentUsers(), debugUserManager(), testUpdateUser(userId, newUsername), testAPICall(), forcePageRefresh(), forceCompleteRefresh(), testUserCreation(), checkModalAccessibility(), checkFormValues(), manualSaveUser(), delayedValidateAndSave(), bypassValidationAndSave()"
);
