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
            email: "تعذر التحقق من الهوية، يرجى التأكد من اسم المستخدم وكلمة المرور.",
          },
        };
      }
      return {
        errors: {
          email: `خطأ في الخادم: ${result.detail || "حدث خطأ غير معروف"}`,
        },
      };
    }

    // Check if the result indicates success
    if (!result.access) {
      return {
        errors: {
          email: "تعذر التحقق من الهوية، يرجى التأكد من اسم المستخدم وكلمة المرور.",
        },
      };
    }

    return result;
  } catch (error: unknown) {
    console.error("Error fetching user by email:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        errors: {
          email: "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى لاحقًا.",
        },
      };
    }

    return {
      errors: {
        email: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
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
            auth: "غير مصرح لك، يرجى تسجيل الدخول.",
          },
        };
      }

      // Validation errors (Django style)
      if (response.status === 400 && result) {
        const { first_name, last_name, ...rest } = result;
        return {
          errors: {
            ...rest,
            ...(first_name && { firstName: first_name }),
            ...(last_name && { lastName: last_name }),
          },
        };
      }

      // Conflict
      if (response.status === 409) {
        return {
          errors: {
            email: "البريد الإلكتروني مستخدم بالفعل.",
          },
        };
      }

      // Fallback
      return {
        errors: {
          general: result?.message || "حدث خطأ ما، يرجى المحاولة مرة أخرى.",
        },
      };
    }

    return { success: true, data: result };
  } catch {
    return {
      errors: {
        network: "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى لاحقًا.",
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
            email: "تعذر التحقق من الهوية، يرجى التأكد من اسم المستخدم وكلمة المرور.",
          },
        };
      }
      return {
        errors: {
          email: `خطأ في الخادم: ${result.detail || "حدث خطأ غير معروف"}`,
        },
      };
    }

    return result;
  } catch (error: unknown) {
    console.error("Error fetching user :", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        errors: {
          email: "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى لاحقًا.",
        },
      };
    }

    return {
      errors: {
        email: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
      },
    };
  }
}
