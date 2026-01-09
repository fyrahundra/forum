<script lang="ts">
  import { page } from '$app/stores';
	import { redirect } from '@sveltejs/kit';
  import { get } from 'svelte/store';

  let token = '';
  let newPassword = '';
  let confirmPassword = '';
  let message = '';
  let error = '';

  // Grab token from URL
  $: token = $page.url.searchParams.get('token') || '';

  async function submitNewPassword() {
    message = '';
    error = '';

    if (!token) {
      error = 'Invalid or missing token.';
      return;
    }

    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match.';
      return;
    }

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();
      if (data.ok) {
        message = 'Password successfully reset! You can now log in.';
        throw redirect(303, '/login');
      } else {
        error = data.error || 'Failed to reset password.';
      }
    } catch (e) {
      error = 'Network error';
    }
  }
</script>

<form on:submit|preventDefault={submitNewPassword}>
  <input type="password" bind:value={newPassword} placeholder="New password" required />
  <input type="password" bind:value={confirmPassword} placeholder="Confirm password" required />
  <button type="submit">Reset Password</button>
</form>

{#if message}
  <p style="color:green">{message}</p>
{/if}

{#if error}
  <p style="color:red">{error}</p>
{/if}
