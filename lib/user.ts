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
        "Accept-Language": "ar",
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

export default async function createUser(data: types) {
  try {
    const response = await fetch(`${API_BASE}api/v1/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "ar",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      // Auth error
      if (response.status === 401) {
        return {
          errors: {
            auth: "Unauthorized. Please login.",
          },
        };
      }

      // Validation errors (Django style)
      if (response.status === 400 && result) {
        return {
          errors: result, // return full backend validation
        };
      }

      // Conflict
      if (response.status === 409) {
        return {
          errors: {
            email: "Email already exists.",
          },
        };
      }

      // Fallback
      return {
        errors: {
          general: result?.message || "Something went wrong",
        },
      };
    }

    return { success: true, data: result };
  } catch  {
    return {
      errors: {
        network: "Cannot connect to server.",
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
        "Accept-Language": "ar",
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
