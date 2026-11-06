
"use client";

export default function LogoutButton() {
  async function handleLogout() {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        alert("Logout failed. Please try again.");
        return;
      }

      window.location.replace("/");
    } catch {
      alert("Unable to log out. Please try again.");
    }
  }

  return (
    <button
      type="button"
      className="logout-link"
      onClick={handleLogout}
    >
      Log Out
    </button>
  );
}
