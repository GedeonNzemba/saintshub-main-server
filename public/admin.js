document.addEventListener('DOMContentLoaded', () => {
    const pendingUsersTbody = document.querySelector('#pending-users-table tbody');
    const jwtInput = document.getElementById('jwt-token');

    const API_BASE_URL = '/api/v1'; // Assuming your API is served from the same origin

    // --- Helper Functions ---
    const getJwtToken = () => {
        const token = jwtInput.value.trim();
        if (!token) {
            alert('Please paste your Admin JWT token first.');
            return null;
        }
        return token;
    }

    const makeApiRequest = async (url, method = 'GET', token, body = null) => {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            }
            // Handle cases with no content response (like PATCH success)
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null; // Or return a specific success indicator if needed
            }
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            alert(`API Request Failed: ${error.message}`);
            throw error; // Re-throw to allow calling function to handle
        }
    };

    // --- Fetch and Display Pending Users ---
    const loadPendingUsers = async () => {
        const token = getJwtToken();
        if (!token) return;

        pendingUsersTbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>'; // Clear table and show loading

        try {
            const data = await makeApiRequest(`${API_BASE_URL}/admin/users/pending`, 'GET', token);
            renderUsers(data.data.users);
        } catch (error) {
            pendingUsersTbody.innerHTML = '<tr><td colspan="4" style="color: red;">Failed to load users. Check console or JWT.</td></tr>';
        }
    };

    // --- Render Users in Table ---
    const renderUsers = (users) => {
        pendingUsersTbody.innerHTML = ''; // Clear previous entries
        if (!users || users.length === 0) {
            pendingUsersTbody.innerHTML = '<tr><td colspan="4">No users pending approval.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', user._id); // Use _id from MongoDB
            row.innerHTML = `
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><button class="approve-btn" data-user-id="${user._id}">Approve</button></td>
            `;
            pendingUsersTbody.appendChild(row);
        });
    };

    // --- Handle User Approval ---
    const approveUser = async (userId, buttonElement) => {
        const token = getJwtToken();
        if (!token) return;

        buttonElement.disabled = true;
        buttonElement.textContent = 'Approving...';

        try {
            // The API returns the approved user data, but we might not need it here
            await makeApiRequest(`${API_BASE_URL}/admin/users/${userId}/approve`, 'PATCH', token);
            alert('User approved successfully!');
            // Remove the user's row from the table
            const rowToRemove = pendingUsersTbody.querySelector(`tr[data-user-id="${userId}"]`);
            if (rowToRemove) {
                rowToRemove.remove();
            }
            // Optional: Check if table is now empty and display message
             if (pendingUsersTbody.children.length === 0) {
                pendingUsersTbody.innerHTML = '<tr><td colspan="4">No users pending approval.</td></tr>';
            }
        } catch (error) {
            // Error already alerted in makeApiRequest
            buttonElement.disabled = false;
            buttonElement.textContent = 'Approve';
        }
    };

    // --- Event Listeners ---
    // Reload users when JWT changes (simple approach)
    jwtInput.addEventListener('change', loadPendingUsers);

    // Delegate event listener for approve buttons
    pendingUsersTbody.addEventListener('click', (event) => {
        if (event.target.classList.contains('approve-btn')) {
            const userId = event.target.getAttribute('data-user-id');
            approveUser(userId, event.target);
        }
    });

    // Initial load attempt (will prompt for JWT if empty)
    // loadPendingUsers(); // Maybe don't load automatically, let user paste token first
    console.log('Admin dashboard JS loaded. Paste JWT and change focus to load users.');
});
