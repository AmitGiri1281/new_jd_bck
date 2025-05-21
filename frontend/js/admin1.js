// Dashboard initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard stats
    fetchDashboardStats();
    
    // Set up navigation
    setupNavigation();
    
    // Load contacts when contacts section is shown
    document.querySelector('a[data-section="contacts"]').addEventListener('click', () => {
        fetchContacts();
    });
});

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        document.getElementById('total-contacts').textContent = data.totalContacts;
        // Update other stats as needed
        // document.getElementById('total-teachers').textContent = data.totalTeachers;
        // document.getElementById('total-courses').textContent = data.totalCourses;
        // document.getElementById('total-students').textContent = data.totalStudents;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showAlert('Failed to load dashboard statistics', 'error');
    }
}

// Fetch contacts with pagination and filtering
let currentPage = 1;
const contactsPerPage = 10;

async function fetchContacts(page = 1, status = 'all', search = '') {
    try {
        showLoading();
        currentPage = page;
        
        const url = new URL('/api/contacts', window.location.origin);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', contactsPerPage);
        if (status !== 'all') url.searchParams.append('status', status);
        if (search) url.searchParams.append('search', search);
        
        const response = await fetch(url);
        const { data, total, totalPages } = await response.json();
        
        renderContactsTable(data);
        updatePaginationControls(total, totalPages);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        showAlert('Failed to load contact submissions', 'error');
    } finally {
        hideLoading();
    }
}

// Render contacts table
function renderContactsTable(contacts) {
    const tableBody = document.querySelector('#contacts-table tbody');
    tableBody.innerHTML = '';
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td>${contact.phone || 'N/A'}</td>
            <td>${contact.course_completed || 'N/A'}</td>
            <td>${contact.course_interested || 'N/A'}</td>
            <td class="truncate">${contact.message}</td>
            <td>${new Date(contact.submitted_at).toLocaleDateString()}</td>
            <td>
                <span class="status-badge ${contact.status}">
                    ${contact.status}
                </span>
            </td>
            <td>
                <select class="status-select" data-id="${contact.id}">
                    <option value="new" ${contact.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="contacted" ${contact.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="admitted" ${contact.status === 'admitted' ? 'selected' : ''}>Admitted</option>
                    <option value="rejected" ${contact.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
                <button class="btn-icon delete-contact" data-id="${contact.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', updateContactStatus);
    });
    
    document.querySelectorAll('.delete-contact').forEach(btn => {
        btn.addEventListener('click', deleteContact);
    });
}

// Update contact status
async function updateContactStatus(event) {
    const contactId = event.target.getAttribute('data-id');
    const newStatus = event.target.value;
    
    try {
        showLoading();
        const response = await fetch(`/api/contacts/${contactId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
        showAlert('Status updated successfully', 'success');
        fetchDashboardStats(); // Refresh stats
    } catch (error) {
        console.error('Error updating status:', error);
        showAlert('Failed to update status', 'error');
        // Revert the select value
        event.target.value = event.target.getAttribute('data-original-value');
    } finally {
        hideLoading();
    }
}

// Delete contact
async function deleteContact(event) {
    const contactId = event.currentTarget.getAttribute('data-id');
    
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        showLoading();
        const response = await fetch(`/api/contacts/${contactId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete contact');
        
        showAlert('Contact deleted successfully', 'success');
        fetchContacts(currentPage); // Refresh current page
        fetchDashboardStats(); // Refresh stats
    } catch (error) {
        console.error('Error deleting contact:', error);
        showAlert('Failed to delete contact', 'error');
    } finally {
        hideLoading();
    }
}

// Update pagination controls
function updatePaginationControls(total, totalPages) {
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    
    // Update total count display if needed
    document.getElementById('total-contacts-display').textContent = total;
}

// Setup event listeners for pagination and filtering
function setupContactsControls() {
    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            fetchContacts(currentPage - 1);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        fetchContacts(currentPage + 1);
    });
    
    // Status filter
    document.getElementById('status-filter').addEventListener('change', (event) => {
        fetchContacts(1, event.target.value);
    });
    
    // Search
    document.getElementById('contact-search').addEventListener('input', debounce((event) => {
        fetchContacts(1, document.getElementById('status-filter').value, event.target.value);
    }, 300));
    
    // Export CSV
    document.getElementById('export-contacts').addEventListener('click', exportContactsToCSV);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Export to CSV
async function exportContactsToCSV() {
    try {
        showLoading();
        const response = await fetch('/api/contacts?limit=1000');
        const { data } = await response.json();
        
        const headers = ['Name', 'Email', 'Phone', 'Course Completed', 'Course Interested', 'Message', 'Status', 'Submitted At'];
        const rows = data.map(contact => [
            contact.name,
            contact.email,
            contact.phone || '',
            contact.course_completed || '',
            contact.course_interested || '',
            contact.message,
            contact.status,
            new Date(contact.submitted_at).toLocaleString()
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `contacts_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting contacts:', error);
        showAlert('Failed to export contacts', 'error');
    } finally {
        hideLoading();
    }
}