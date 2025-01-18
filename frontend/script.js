const apiUrl = 'http://localhost:5000';

// Show the Register form
document.getElementById('showRegisterForm').addEventListener('click', () => {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('registerSection').style.display = 'block';
});

// Show the Login form
document.getElementById('showLoginForm').addEventListener('click', () => {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('registerSection').style.display = 'none';
});

// Handle user login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  // Input validation
  if (!email || !password) {
    alert('Please fill in both email and password.');
    return;
  }

  const response = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    alert('Login failed. Please try again later.');
    return;
  }

  const data = await response.json();

  if (data.token) {
    localStorage.setItem('token', data.token); // Store token in localStorage
    alert('Login successful');
    document.getElementById('loginForm').reset();
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userSection').style.display = 'block';
    fetchUsers();
  } else {
    alert('Login failed: ' + data.message);
  }
});

// Handle user registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  // Input validation
  if (!name || !email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  const response = await fetch(`${apiUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    alert('Something went wrong! Please try again later.');
    return;
  }

  const data = await response.json();

  if (data.token) {
    localStorage.setItem('token', data.token); // Store token in localStorage
    alert('Registration successful');
    document.getElementById('registerForm').reset();
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('userSection').style.display = 'block';
    fetchUsers();
  } else {
    alert('Registration failed: ' + data.message);
  }
});

// Fetch and display all users (with JWT)
async function fetchUsers() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in');
    return;
  }

  const response = await fetch(`${apiUrl}/users`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    alert('Error fetching users');
    return;
  }

  const users = await response.json();
  const userTable = document.getElementById('userTable').getElementsByTagName('tbody')[0];
  userTable.innerHTML = '';

  if (users.length === 0) {
    userTable.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
  }

  users.forEach(user => {
    const row = userTable.insertRow();
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.age}</td>
      <td>
        <button class="edit" onclick="editUser(${user.id})">Edit</button>
        <button class="delete" onclick="deleteUser(${user.id})">Delete</button>
      </td>
    `;
  });
}

// Handle adding new user
document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const age = document.getElementById('age').value;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in');
    return;
  }

  // Input validation
  if (!name || !email || !age) {
    alert('Please fill in all fields');
    return;
  }

  const response = await fetch(`${apiUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email, age }),
  });

  if (!response.ok) {
    alert('Error adding user');
    return;
  }

  fetchUsers();
});

// Handle deleting a user
async function deleteUser(id) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in');
    return;
  }

  const response = await fetch(`${apiUrl}/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    alert('Error deleting user');
    return;
  }

  fetchUsers();
}

// Edit user functionality
async function editUser(id) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in');
    return;
  }

  const response = await fetch(`${apiUrl}/users/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    alert('Error fetching user data');
    return;
  }

  const user = await response.json();

  // Populate the form with the user's current data for editing
  document.getElementById('name').value = user.name;
  document.getElementById('email').value = user.email;
  document.getElementById('age').value = user.age;

  // Change button behavior to update the user
  const userForm = document.getElementById('userForm');
  userForm.removeEventListener('submit', handleAddUser); // Remove the add user event listener
  userForm.addEventListener('submit', (e) => handleUpdateUser(e, id)); // Add the update user event listener
}

// Handle updating a user
async function handleUpdateUser(e, id) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const age = document.getElementById('age').value;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in');
    return;
  }

  // Input validation
  if (!name || !email || !age) {
    alert('Please fill in all fields');
    return;
  }

  const response = await fetch(`${apiUrl}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email, age }),
  });

  if (!response.ok) {
    alert('Error updating user');
    return;
  }

  fetchUsers();

  // Reset form and switch to Add User mode
  document.getElementById('userForm').reset();
  const userForm = document.getElementById('userForm');
  userForm.removeEventListener('submit', handleUpdateUser); // Remove update listener
  userForm.addEventListener('submit', handleAddUser); // Add back the add user listener
}

// Handle adding user
function handleAddUser(e) {
  // Prevent form submission
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const age = document.getElementById('age').value;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in');
    return;
  }

  // Input validation
  if (!name || !email || !age) {
    alert('Please fill in all fields');
    return;
  }

  const response = await fetch(`${apiUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email, age }),
  });
  
  if (!response.ok) {
    alert('Error adding user');
    return;
  }
  
  fetchUsers();
  
}
