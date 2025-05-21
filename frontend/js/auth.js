document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Login successful!');
      // redirect or set session here
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
});


document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reset-email').value.trim();

  try {
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('reset-success').textContent = data.message;
      document.getElementById('reset-error').textContent = '';
    } else {
      document.getElementById('reset-error').textContent = data.error;
      document.getElementById('reset-success').textContent = '';
    }
  } catch (error) {
    document.getElementById('reset-error').textContent = 'Network error: ' + error.message;
    document.getElementById('reset-success').textContent = '';
  }
});
