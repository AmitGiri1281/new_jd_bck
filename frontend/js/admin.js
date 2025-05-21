// admin.js - Client-side JavaScript for Admin Panel

document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentPage = 1;
    const itemsPerPage = 10;
    let authToken = localStorage.getItem('adminToken');
    
    // Check authentication
    if (!authToken) {
        window.location.href = 'dashboard.html';
        return;
    }

    // DOM Elements
    const logoutBtn = document.getElementById('logout-btn');
    const navLinks = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.admin-section');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Initialize the admin panel
    initAdminPanel();

    // Event Listeners
    logoutBtn.addEventListener('click', handleLogout);
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(this.dataset.section);
        });
    });

    // Initialize modals and forms
    initModals();
    initForms();

    // Load initial data
    loadDashboardData();
    loadContactSubmissions();
    loadTeachers();
    loadCourses();
    loadStudents();
    loadTestimonials();

    // Functions
    function initAdminPanel() {
        // Set active section based on URL hash
        const hash = window.location.hash.substr(1);
        const defaultSection = hash || 'dashboard';
        showSection(defaultSection);
        
        // Load admin profile
        loadAdminProfile();
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function showSection(sectionId) {
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            }
        });

        // Show corresponding section
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionId}-section`) {
                section.classList.add('active');
            }
        });

        // Update URL hash
        window.location.hash = sectionId;

        // Load section-specific data
        switch(sectionId) {
            case 'contacts':
                loadContactSubmissions();
                break;
            case 'teachers':
                loadTeachers();
                break;
            case 'courses':
                loadCourses();
                break;
            case 'students':
                loadStudents();
                break;
            case 'website':
                loadWebsiteContent();
                break;
        }
    }

    async function loadAdminProfile() {
        try {
            const response = await fetch('/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load profile');
            
            const data = await response.json();
            document.getElementById('user-name').textContent = data.username;
            document.getElementById('user-avatar').src = data.avatar || '/images/default-admin.png';
        } catch (error) {
            showAlert('error', error.message);
        }
    }

    async function loadDashboardData() {
        showLoading();
        try {
            const response = await fetch('/api/contact/dashboard', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load dashboard data');
            
            const data = await response.json();
            
            // Update stats
            document.getElementById('total-contacts').textContent = data.contactsCount;
            document.getElementById('total-teachers').textContent = data.teachersCount;
            document.getElementById('total-courses').textContent = data.coursesCount;
            document.getElementById('total-students').textContent = data.studentsCount;
            
            // Update recent activity
            const activityFeed = document.getElementById('activity-feed');
            activityFeed.innerHTML = data.recentActivities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.description}</p>
                        <small class="activity-time">${new Date(activity.timestamp).toLocaleString()}</small>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            showAlert('error', error.message);
        } finally {
            hideLoading();
        }
    }

    function getActivityIcon(type) {
        const icons = {
            'contact': 'fas fa-envelope',
            'teacher': 'fas fa-chalkboard-teacher',
            'course': 'fas fa-book',
            'student': 'fas fa-user-graduate',
            'system': 'fas fa-cog'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    async function loadContactSubmissions(page = 1, search = '', status = 'all') {
        showLoading();
        try {
            const url = `/api/admin/contacts?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}&status=${status}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load contacts');
            
            const data = await response.json();
            contactsData = data.contacts;
            
            // Update table
            const tbody = document.querySelector('#contacts-table tbody');
            tbody.innerHTML = contactsData.map(contact => `
                <tr>
                    <td>${contact.name}</td>
                    <td>${contact.email}</td>
                    <td>${contact.phone || '-'}</td>
                    <td>${contact.percentage_10 || '-'}</td>
                    <td>${contact.percentage_12 || '-'}</td>
                    <td>${contact.course || 'Not specified'}</td>
                    <td>${contact.message ? contact.message.substring(0, 30) + (contact.message.length > 30 ? '...' : '') : '-'}</td>
                    <td>${new Date(contact.created_at).toLocaleDateString()}</td>
                    <td>
                        <select class="status-select" data-id="${contact.id}">
                            <option value="new" ${contact.status === 'new' ? 'selected' : ''}>New</option>
                            <option value="contacted" ${contact.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                            <option value="admitted" ${contact.status === 'admitted' ? 'selected' : ''}>Admitted</option>
                            <option value="rejected" ${contact.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn-view" data-id="${contact.id}">View</button>
                        <button class="btn-delete" data-id="${contact.id}">Delete</button>
                    </td>
                </tr>
            `).join('');
            
            // Update pagination
            updatePagination(data.total, page, 'contacts');
            
            // Add event listeners
            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', function() {
                    updateContactStatus(this.dataset.id, this.value);
                });
            });
            
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', function() {
                    deleteContact(this.dataset.id);
                });
            });
            
        } catch (error) {
            showAlert('error', error.message);
        } finally {
            hideLoading();
        }
    }

    function updatePagination(totalItems, currentPage, type) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (type === 'contacts') {
            document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= totalPages;
            
            // Update event listeners
            document.getElementById('prev-page').onclick = () => {
                if (currentPage > 1) loadContactSubmissions(currentPage - 1);
            };
            
            document.getElementById('next-page').onclick = () => {
                if (currentPage < totalPages) loadContactSubmissions(currentPage + 1);
            };
        }
        // Similar implementation for other paginated sections
    }

    async function updateContactStatus(contactId, newStatus) {
        try {
            const response = await fetch(`/api/frontend/contacts/${contactId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) throw new Error('Failed to update status');
            
            showAlert('success', 'Contact status updated successfully');
        } catch (error) {
            showAlert('error', error.message);
        }
    }

    async function deleteContact(contactId) {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        
        try {
            const response = await fetch(`/api/frontend/contacts/${contactId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete contact');
            
            showAlert('success', 'Contact deleted successfully');
            loadContactSubmissions(currentPage);
        } catch (error) {
            showAlert('error', error.message);
        }
    }

    // Similar implementations for:
    // - loadTeachers()
    // - loadCourses()
    // - loadStudents()
    // - loadTestimonials()
    // - loadWebsiteContent()

    function initModals() {
        // Initialize all modals (teacher, course, student, etc.)
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close-modal');
            
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Teacher modal
        document.getElementById('add-teacher-btn').addEventListener('click', () => {
            document.getElementById('teacher-modal').style.display = 'block';
            document.getElementById('teacher-form').reset();
            document.getElementById('teacher-id').value = '';
            document.getElementById('modal-title').textContent = 'Add New Teacher';
        });
        
        // Similar for other modals
    }

    function initForms() {
        // Teacher form
        document.getElementById('teacher-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveTeacher();
        });
        
        // Similar for other forms
    }

    async function saveTeacher() {
        const form = document.getElementById('teacher-form');
        const formData = new FormData(form);
        const teacherId = formData.get('id');
        const isEdit = !!teacherId;
        
        try {
            showLoading();
            
            const response = await fetch(
                isEdit ? `/api/admin/teachers/${teacherId}` : '/api/admin/teachers',
                {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                }
            );
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save teacher');
            }
            
            showAlert('success', `Teacher ${isEdit ? 'updated' : 'added'} successfully`);
            document.getElementById('teacher-modal').style.display = 'none';
            loadTeachers();
        } catch (error) {
            showAlert('error', error.message);
        } finally {
            hideLoading();
        }
    }

    function handleLogout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    }

    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 500);
        }, 3000);
    }
});



document.getElementById('logout-btn').addEventListener('click', function () {
  // Clear token or session data (if you're using localStorage or sessionStorage)
  localStorage.removeItem('authToken');  // or sessionStorage.removeItem()

  // Redirect to homepage (change this if your homepage is different)
  window.location.href = 'index.html';
});

// Additional helper functions would be here

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.admin-nav a');
  const sections = document.querySelectorAll('.admin-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active from all
      navLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(sec => sec.classList.remove('active'));

      // Add active to clicked
      link.classList.add('active');
      const sectionId = `${link.dataset.section}-section`;
      document.getElementById(sectionId).classList.add('active');
    });
  });
});



function renderCharts() {
  // Enrollments Line Chart
  const enrollmentsCtx = document.getElementById('enrollments-chart').getContext('2d');
  new Chart(enrollmentsCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [{
        label: 'Enrollments',
        data: [10, 20, 15, 30, 25],
        borderColor: '#3498db',
        fill: true,
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        tension: 0.4
      }]
    },
  });

  // Course Pie Chart
  const coursesCtx = document.getElementById('courses-chart').getContext('2d');
  new Chart(coursesCtx, {
    type: 'pie',
    data: {
      labels: ['Science', 'Commerce', 'Arts'],
      datasets: [{
        label: 'Courses',
        data: [5, 3, 4],
        backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c']
      }]
    }
  });
}

renderCharts();


function loadContacts() {
  const tbody = document.querySelector('#contacts-table tbody');
  tbody.innerHTML = `
    <tr>
      <td>Ravi Kumar</td>
      <td>ravi@example.com</td>
      <td>9876543210</td>
      <td>85%</td>
      <td>88%</td>
      <td>B.Sc</td>
      <td>Interested in Science</td>
      <td>2025-05-19</td>
      <td><span class="status new">New</span></td>
      <td><button>Edit</button></td>
    </tr>
  `;
}
loadContacts();



document.getElementById('contact-search').addEventListener('input', function () {
  const search = this.value.toLowerCase();
  const rows = document.querySelectorAll('#contacts-table tbody tr');

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
});


document.getElementById('logout-btn').addEventListener('click', () => {
  alert("Logged out!");
  // Or redirect: window.location.href = "login.html";
});

const btn = document.querySelector('#someButtonId');
if (btn) {
  btn.addEventListener('click', () => {
    // your code
  });
} else {
  console.warn('Button not found');
}















// admin.js - Client-side JavaScript for Admin Panel

// document.addEventListener('DOMContentLoaded', function() {
//     // Global variables
//     const itemsPerPage = 10;
//     let currentPage = 1;
//     let currentSection = 'dashboard';
//     let authToken = localStorage.getItem('adminToken');
    
//    // Check authentication
//     if (!authToken) {
//         window.location.href = 'dashboard.html';
//         return;
//     }

//     // DOM Elements
//     const logoutBtn = document.getElementById('logout-btn');
//     const navLinks = document.querySelectorAll('.admin-nav a');
//     const sections = document.querySelectorAll('.admin-section');
//     const loadingOverlay = document.getElementById('loading-overlay');
//     const contactSearchInput = document.getElementById('contact-search');
//     const contactStatusFilter = document.getElementById('contact-status-filter');

//     // Initialize the admin panel
//     initAdminPanel();

//     // Event Listeners
//     logoutBtn.addEventListener('click', handleLogout);
    
//     navLinks.forEach(link => {
//         link.addEventListener('click', function(e) {
//             e.preventDefault();
//             showSection(this.dataset.section);
//         });
//     });

//     // Search and filter events
//     contactSearchInput.addEventListener('input', debounce(() => {
//         loadContactSubmissions(currentPage, contactSearchInput.value, contactStatusFilter.value);
//     }, 300));

//     contactStatusFilter.addEventListener('change', () => {
//         loadContactSubmissions(1, contactSearchInput.value, contactStatusFilter.value);
//     });

//     // Initialize UI components
//     initModals();
//     initForms();
//     initPagination();
//     renderCharts();

//     // Functions
//     function initAdminPanel() {
//         // Set active section based on URL hash
//         const hash = window.location.hash.substr(1);
//         const defaultSection = hash || 'dashboard';
//         showSection(defaultSection);
        
//         // Load admin profile
//         loadAdminProfile();
//     }

//     function showLoading() {
//         loadingOverlay.style.display = 'flex';
//     }

//     function hideLoading() {
//         loadingOverlay.style.display = 'none';
//     }

//     function showSection(sectionId) {
//         currentSection = sectionId;
        
//         // Update active nav link
//         navLinks.forEach(link => {
//             link.classList.remove('active');
//             if (link.dataset.section === sectionId) {
//                 link.classList.add('active');
//             }
//         });

//         // Show corresponding section
//         sections.forEach(section => {
//             section.classList.remove('active');
//             if (section.id === `${sectionId}-section`) {
//                 section.classList.add('active');
//             }
//         });

//         // Update URL hash
//         window.location.hash = sectionId;

//         // Load section-specific data
//         switch(sectionId) {
//             case 'dashboard':
//                 loadDashboardData();
//                 break;
//             case 'contacts':
//                 loadContactSubmissions();
//                 break;
//             case 'teachers':
//                 loadTeachers();
//                 break;
//             case 'courses':
//                 loadCourses();
//                 break;
//             case 'students':
//                 loadStudents();
//                 break;
//             case 'testimonials':
//                 loadTestimonials();
//                 break;
//             case 'website':
//                 loadWebsiteContent();
//                 break;
//         }
//     }

//     async function loadAdminProfile() {
//         try {
//             showLoading();
//             const response = await fetch('/api/admin/profile', {
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to load profile');
//             }
            
//             const data = await response.json();
//             document.getElementById('user-name').textContent = data.username;
//             document.getElementById('user-avatar').src = data.avatar || '/images/default-admin.png';
//         } catch (error) {
//             showAlert('error', error.message);
//             handleLogout();
//         } finally {
//             hideLoading();
//         }
//     }

//     async function loadDashboardData() {
//         showLoading();
//         try {
//             const response = await fetch('/api/admin/dashboard', {
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to load dashboard data');
//             }
            
//             const data = await response.json();
            
//             // Update stats
//             document.getElementById('total-contacts').textContent = data.contactsCount;
//             document.getElementById('total-teachers').textContent = data.teachersCount;
//             document.getElementById('total-courses').textContent = data.coursesCount;
//             document.getElementById('total-students').textContent = data.studentsCount;
            
//             // Update recent activity
//             const activityFeed = document.getElementById('activity-feed');
//             activityFeed.innerHTML = data.recentActivities.map(activity => `
//                 <div class="activity-item">
//                     <div class="activity-icon">
//                         <i class="${getActivityIcon(activity.type)}"></i>
//                     </div>
//                     <div class="activity-content">
//                         <p>${activity.description}</p>
//                         <small class="activity-time">${formatDateTime(activity.timestamp)}</small>
//                     </div>
//                 </div>
//             `).join('');
            
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     function getActivityIcon(type) {
//         const icons = {
//             'contact': 'fas fa-envelope',
//             'teacher': 'fas fa-chalkboard-teacher',
//             'course': 'fas fa-book',
//             'student': 'fas fa-user-graduate',
//             'system': 'fas fa-cog'
//         };
//         return icons[type] || 'fas fa-info-circle';
//     }

//     function formatDateTime(timestamp) {
//         const date = new Date(timestamp);
//         return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
//     }

//     async function loadContactSubmissions(page = 1, search = '', status = 'all') {
//         showLoading();
//         currentPage = page;
        
//         try {
//             const url = `/api/admin/contacts?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}&status=${status}`;
//             const response = await fetch(url, {
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to load contacts');
//             }
            
//             const data = await response.json();
            
//             // Update table
//             const tbody = document.querySelector('#contacts-table tbody');
//             tbody.innerHTML = data.contacts.map(contact => `
//                 <tr>
//                     <td>${contact.name}</td>
//                     <td>${contact.email}</td>
//                     <td>${contact.phone || '-'}</td>
//                     <td>${contact.percentage_10 || '-'}</td>
//                     <td>${contact.percentage_12 || '-'}</td>
//                     <td>${contact.course || 'Not specified'}</td>
//                     <td>${contact.message ? contact.message.substring(0, 30) + (contact.message.length > 30 ? '...' : '') : '-'}</td>
//                     <td>${formatDateTime(contact.created_at)}</td>
//                     <td>
//                         <select class="status-select" data-id="${contact.id}">
//                             <option value="new" ${contact.status === 'new' ? 'selected' : ''}>New</option>
//                             <option value="contacted" ${contact.status === 'contacted' ? 'selected' : ''}>Contacted</option>
//                             <option value="admitted" ${contact.status === 'admitted' ? 'selected' : ''}>Admitted</option>
//                             <option value="rejected" ${contact.status === 'rejected' ? 'selected' : ''}>Rejected</option>
//                         </select>
//                     </td>
//                     <td>
//                         <button class="btn btn-view" data-id="${contact.id}">
//                             <i class="fas fa-eye"></i>
//                         </button>
//                         <button class="btn btn-delete" data-id="${contact.id}">
//                             <i class="fas fa-trash"></i>
//                         </button>
//                     </td>
//                 </tr>
//             `).join('');
            
//             // Update pagination
//             updatePagination(data.total, page, 'contacts');
            
//             // Add event listeners
//             document.querySelectorAll('.status-select').forEach(select => {
//                 select.addEventListener('change', function() {
//                     updateContactStatus(this.dataset.id, this.value);
//                 });
//             });
            
//             document.querySelectorAll('.btn-view').forEach(btn => {
//                 btn.addEventListener('click', function() {
//                     viewContactDetails(this.dataset.id);
//                 });
//             });
            
//             document.querySelectorAll('.btn-delete').forEach(btn => {
//                 btn.addEventListener('click', function() {
//                     deleteContact(this.dataset.id);
//                 });
//             });
            
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     function initPagination() {
//         document.getElementById('prev-page').addEventListener('click', () => {
//             if (currentPage > 1) {
//                 loadContactSubmissions(currentPage - 1, contactSearchInput.value, contactStatusFilter.value);
//             }
//         });
        
//         document.getElementById('next-page').addEventListener('click', () => {
//             loadContactSubmissions(currentPage + 1, contactSearchInput.value, contactStatusFilter.value);
//         });
//     }

//     function updatePagination(totalItems, currentPage, type) {
//         const totalPages = Math.ceil(totalItems / itemsPerPage);
        
//         if (type === 'contacts') {
//             const pageInfo = document.getElementById('page-info');
//             const prevBtn = document.getElementById('prev-page');
//             const nextBtn = document.getElementById('next-page');
            
//             pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
//             prevBtn.disabled = currentPage <= 1;
//             nextBtn.disabled = currentPage >= totalPages;
//         }
//     }

//     async function updateContactStatus(contactId, newStatus) {
//         try {
//             showLoading();
//             const response = await fetch(`/api/admin/contacts/${contactId}/status`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${authToken}`
//                 },
//                 body: JSON.stringify({ status: newStatus })
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to update status');
//             }
            
//             showAlert('success', 'Contact status updated successfully');
//             loadContactSubmissions(currentPage);
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     async function viewContactDetails(contactId) {
//         try {
//             showLoading();
//             const response = await fetch(`/api/admin/contacts/${contactId}`, {
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to load contact details');
//             }
            
//             const contact = await response.json();
            
//             // Populate modal with contact details
//             document.getElementById('contact-detail-name').textContent = contact.name;
//             document.getElementById('contact-detail-email').textContent = contact.email;
//             document.getElementById('contact-detail-phone').textContent = contact.phone || 'Not provided';
//             document.getElementById('contact-detail-10th').textContent = contact.percentage_10 || 'Not provided';
//             document.getElementById('contact-detail-12th').textContent = contact.percentage_12 || 'Not provided';
//             document.getElementById('contact-detail-course').textContent = contact.course || 'Not specified';
//             document.getElementById('contact-detail-message').textContent = contact.message || 'No message';
//             document.getElementById('contact-detail-date').textContent = formatDateTime(contact.created_at);
//             document.getElementById('contact-detail-status').textContent = contact.status.charAt(0).toUpperCase() + contact.status.slice(1);
            
//             // Show the modal
//             document.getElementById('contact-detail-modal').style.display = 'block';
            
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     async function deleteContact(contactId) {
//         if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;
        
//         try {
//             showLoading();
//             const response = await fetch(`/api/admin/contacts/${contactId}`, {
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to delete contact');
//             }
            
//             showAlert('success', 'Contact deleted successfully');
//             loadContactSubmissions(currentPage);
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     // Teacher Management Functions
//     async function loadTeachers(page = 1) {
//         showLoading();
//         try {
//             const response = await fetch(`/api/admin/teachers?page=${page}&limit=${itemsPerPage}`, {
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to load teachers');
//             }
            
//             const data = await response.json();
            
//             // Update teachers table
//             const tbody = document.querySelector('#teachers-table tbody');
//             tbody.innerHTML = data.teachers.map(teacher => `
//                 <tr>
//                     <td>
//                         <img src="${teacher.photo || '/images/default-teacher.png'}" alt="${teacher.name}" class="teacher-avatar">
//                     </td>
//                     <td>${teacher.name}</td>
//                     <td>${teacher.email}</td>
//                     <td>${teacher.phone || '-'}</td>
//                     <td>${teacher.qualification || '-'}</td>
//                     <td>${teacher.specialization || '-'}</td>
//                     <td>${teacher.experience || '0'} years</td>
//                     <td>
//                         <button class="btn btn-edit" data-id="${teacher.id}">
//                             <i class="fas fa-edit"></i>
//                         </button>
//                         <button class="btn btn-delete" data-id="${teacher.id}">
//                             <i class="fas fa-trash"></i>
//                         </button>
//                     </td>
//                 </tr>
//             `).join('');
            
//             // Add event listeners for edit and delete
//             document.querySelectorAll('.btn-edit').forEach(btn => {
//                 btn.addEventListener('click', function() {
//                     editTeacher(this.dataset.id);
//                 });
//             });
            
//             document.querySelectorAll('.btn-delete').forEach(btn => {
//                 btn.addEventListener('click', function() {
//                     deleteTeacher(this.dataset.id);
//                 });
//             });
            
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     async function editTeacher(teacherId) {
//         try {
//             showLoading();
//             const response = await fetch(`/api/admin/teachers/${teacherId}`, {
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to load teacher data');
//             }
            
//             const teacher = await response.json();
            
//             // Populate the form
//             const form = document.getElementById('teacher-form');
//             form.reset();
            
//             document.getElementById('teacher-id').value = teacher.id;
//             document.getElementById('teacher-name').value = teacher.name;
//             document.getElementById('teacher-email').value = teacher.email;
//             document.getElementById('teacher-phone').value = teacher.phone || '';
//             document.getElementById('teacher-qualification').value = teacher.qualification || '';
//             document.getElementById('teacher-specialization').value = teacher.specialization || '';
//             document.getElementById('teacher-experience').value = teacher.experience || '';
//             document.getElementById('teacher-bio').value = teacher.bio || '';
            
//             // Update the modal title
//             document.getElementById('modal-title').textContent = 'Edit Teacher';
            
//             // Show the modal
//             document.getElementById('teacher-modal').style.display = 'block';
            
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     async function deleteTeacher(teacherId) {
//         if (!confirm('Are you sure you want to delete this teacher? All associated data will also be removed.')) return;
        
//         try {
//             showLoading();
//             const response = await fetch(`/api/admin/teachers/${teacherId}`, {
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to delete teacher');
//             }
            
//             showAlert('success', 'Teacher deleted successfully');
//             loadTeachers();
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     // Similar implementations for:
//     // - loadCourses()
//     // - loadStudents()
//     // - loadTestimonials()
//     // - loadWebsiteContent()

//     function initModals() {
//         // Initialize all modals
//         const modals = document.querySelectorAll('.modal');
        
//         modals.forEach(modal => {
//             const closeBtn = modal.querySelector('.close-modal');
            
//             closeBtn.addEventListener('click', () => {
//                 modal.style.display = 'none';
//             });
            
//             window.addEventListener('click', (e) => {
//                 if (e.target === modal) {
//                     modal.style.display = 'none';
//                 }
//             });
//         });
        
//         // Teacher modal
//         document.getElementById('add-teacher-btn').addEventListener('click', () => {
//             document.getElementById('teacher-modal').style.display = 'block';
//             document.getElementById('teacher-form').reset();
//             document.getElementById('teacher-id').value = '';
//             document.getElementById('modal-title').textContent = 'Add New Teacher';
//         });
        
//         // Course modal
//         document.getElementById('add-course-btn').addEventListener('click', () => {
//             document.getElementById('course-modal').style.display = 'block';
//             document.getElementById('course-form').reset();
//             document.getElementById('course-id').value = '';
//             document.getElementById('modal-title-course').textContent = 'Add New Course';
//         });
//     }

//     function initForms() {
//         // Teacher form
//         document.getElementById('teacher-form').addEventListener('submit', async function(e) {
//             e.preventDefault();
//             await saveTeacher();
//         });
        
//         // Course form
//         document.getElementById('course-form').addEventListener('submit', async function(e) {
//             e.preventDefault();
//             await saveCourse();
//         });
//     }

//     async function saveTeacher() {
//         const form = document.getElementById('teacher-form');
//         const formData = new FormData(form);
//         const teacherId = formData.get('id');
//         const isEdit = !!teacherId;
        
//         try {
//             showLoading();
            
//             const response = await fetch(
//                 isEdit ? `/api/admin/teachers/${teacherId}` : '/api/admin/teachers',
//                 {
//                     method: isEdit ? 'PUT' : 'POST',
//                     headers: {
//                         'Authorization': `Bearer ${authToken}`
//                     },
//                     body: formData
//                 }
//             );
            
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.message || 'Failed to save teacher');
//             }
            
//             showAlert('success', `Teacher ${isEdit ? 'updated' : 'added'} successfully`);
//             document.getElementById('teacher-modal').style.display = 'none';
//             loadTeachers();
//         } catch (error) {
//             showAlert('error', error.message);
//         } finally {
//             hideLoading();
//         }
//     }

//     async function saveCourse() {
//         // Similar implementation to saveTeacher()
//     }

//     function handleLogout() {
//         localStorage.removeItem('adminToken');
//         window.location.href = '/admin/login';
//     }

//     function showAlert(type, message) {
//         const alertDiv = document.createElement('div');
//         alertDiv.className = `alert alert-${type}`;
//         alertDiv.textContent = message;
        
//         document.body.appendChild(alertDiv);
        
//         setTimeout(() => {
//             alertDiv.classList.add('fade-out');
//             setTimeout(() => alertDiv.remove(), 500);
//         }, 3000);
//     }

//     function debounce(func, wait) {
//         let timeout;
//         return function() {
//             const context = this, args = arguments;
//             clearTimeout(timeout);
//             timeout = setTimeout(() => {
//                 func.apply(context, args);
//             }, wait);
//         };
//     }

//     function renderCharts() {
//         // Enrollments Line Chart
//         const enrollmentsCtx = document.getElementById('enrollments-chart');
//         if (enrollmentsCtx) {
//             new Chart(enrollmentsCtx.getContext('2d'), {
//                 type: 'line',
//                 data: {
//                     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
//                     datasets: [{
//                         label: 'Enrollments',
//                         data: [12, 19, 15, 27, 23, 32],
//                         borderColor: '#3498db',
//                         backgroundColor: 'rgba(52, 152, 219, 0.1)',
//                         borderWidth: 2,
//                         tension: 0.4,
//                         fill: true
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         }
//                     }
//                 }
//             });
//         }

//         // Course Distribution Pie Chart
//         const coursesCtx = document.getElementById('courses-chart');
//         if (coursesCtx) {
//             new Chart(coursesCtx.getContext('2d'), {
//                 type: 'pie',
//                 data: {
//                     labels: ['Science', 'Commerce', 'Arts', 'Professional'],
//                     datasets: [{
//                         data: [35, 25, 20, 20],
//                         backgroundColor: [
//                             '#2ecc71',
//                             '#f39c12',
//                             '#e74c3c',
//                             '#9b59b6'
//                         ],
//                         borderWidth: 1
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'right',
//                         }
//                     }
//                 }
//             });
//         }
//     }
// });