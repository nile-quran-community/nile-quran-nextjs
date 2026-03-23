const API_BASE = process.env.BASE_URL;
interface types {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  referrer: string;
}
export async function Login(username: string, password: string) {
  try {
    const response = await fetch(`${API_BASE}auth/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        return {
          errors: {
            email:
              "Could not authenticate user. Please check your credentials.",
          },
        };
      }
      return {
        errors: {
          email: `Server error: ${result.detail || "Unknown error occurred"}`,
        },
      };
    }

    // Check if the result indicates success
    if (!result.access) {
      return {
        errors: {
          email: "Could not authenticate user. Please check your credentials.",
        },
      };
    }

    return result;
  } catch (error: unknown) {
    console.error("Error fetching user by email:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        errors: {
          email:
            "Network error: Unable to connect to the server. Please check if the server is running.",
        },
      };
    }

    return {
      errors: {
        email: "An unexpected error occurred. Please try again.",
      },
    };
  }
}

export default async function createUser({
  first_name,
  last_name,
  email,
  password,
  username,
  referrer,
}: types) {
  try {
    const userData = {
      first_name,
      last_name,
      email,
      password,
      username,
      referrer,
    };

    const response = await fetch(`${API_BASE}api/v1/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (
        response.status === 409 ||
        result.message?.includes("email already exists")
      ) {
        return {
          errors: {
            email:
              "It seems like an account for the chosen email already exists.",
          },
        };
      }
      return {
        errors: {
          email: `Server error: ${result.message || "Unknown error occurred"}`,
        },
      };
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        errors: {
          email:
            "Network error: Unable to connect to the server. Please check if the server is running.",
        },
      };
    }

    return {
      errors: {
        email: "An unexpected error occurred. Please try again.",
      },
    };
  }
}
export async function getUserRole(token: string) {
  try {
    const response = await fetch(`${API_BASE}api/v1/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        return {
          errors: {
            email:
              "Could not authenticate user. Please check your credentials.",
          },
        };
      }
      return {
        errors: {
          email: `Server error: ${result.detail || "Unknown error occurred"}`,
        },
      };
    }

    return result;
  } catch (error: unknown) {
    console.error("Error fetching user :", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        errors: {
          email:
            "Network error: Unable to connect to the server. Please check if the server is running.",
        },
      };
    }

    return {
      errors: {
        email: "An unexpected error occurred. Please try again.",
      },
    };
  }
}
