import { test, expect } from "playwright-test-coverage";

// Helper function: Log in a user
async function login(page, email, password) {
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await expect(page.getByPlaceholder("Email address")).toBeVisible();
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

// Helper function: Get random token
function randomToken() {
  return Math.random().toString(36).substring(2);
}

// Test for home page
test("home page", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("JWT Pizza");
});

// Test for login functionality
test("login", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      const loginReq = { email: "d@jwt.com", password: "a" };
      const loginRes = {
        user: { id: 3, name: "Kai Chen", email: "d@jwt.com", roles: [{ role: "diner" }] },
        token: randomToken(),
      };
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });

  await login(page, "d@jwt.com", "a");
  await expect(page.getByRole("link", { name: "KC" })).toBeVisible(); // Check if user info is visible
});

// Test for registration functionality
test("register", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "POST") {
      const registerReq = { name: "David Wallace", email: "w@jwt.com", password: "c" };
      const registerRes = {
        user: { id: 4, name: "David Wallace", email: "w@jwt.com", roles: [{ role: "diner" }] },
        token: randomToken(),
      };
      expect(route.request().postDataJSON()).toMatchObject(registerReq);
      await route.fulfill({ json: registerRes });
    }
  });

  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await expect(page.getByPlaceholder("Full name")).toBeVisible();
  await page.getByPlaceholder("Full name").fill("David Wallace");
  await page.getByPlaceholder("Email address").fill("w@jwt.com");
  await page.getByPlaceholder("Password").fill("c");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("link", { name: "DW" })).toBeVisible(); // Check if user info is visible
});

test("logout", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      const loginReq = { email: "d@jwt.com", password: "a" };
      const loginRes = {
        user: { id: 3, name: "Kai Chen", email: "d@jwt.com", roles: [{ role: "diner" }] },
        token: randomToken(),
      };
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    } else if (route.request().method() === "DELETE") {
      const logoutRes = { message: "logout successful" };
      await route.fulfill({ json: logoutRes });
    }
  });

  await login(page, "d@jwt.com", "a");
  await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
  await page.getByRole("link", { name: "Logout" }).click();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
});

// Test for about page
test("about page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "About" })).toBeVisible();
  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByText("The secret sauce")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Our employees" })).toBeVisible();
});

// Test for history page
test("history page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "History" })).toBeVisible();
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByText("Mama Rucci, my my")).toBeVisible();
});

// Test for purchase with login
test("purchase with login", async ({ page }) => {
  // Mock login route (PUT)
  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      const loginReq = { email: "d@jwt.com", password: "a" };
      const loginRes = {
        user: { id: 3, name: "Kai Chen", email: "d@jwt.com", roles: [{ role: "diner" }] },
        token: randomToken(),
      };
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });

  // Mock menu route
  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      { id: 2, title: "Pepperoni", image: "pizza2.png", price: 0.0042, description: "Spicy treat" },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  // Mock franchise route
  await page.route("*/**/api/franchise", async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: "LotaPizza",
        stores: [
          { id: 4, name: "Lehi" },
          { id: 5, name: "Springville" },
          { id: 6, name: "American Fork" },
        ],
      },
      { id: 3, name: "PizzaCorp", stores: [{ id: 7, name: "Spanish Fork" }] },
      { id: 4, name: "topSpot", stores: [] },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  await page.route("*/**/api/order", async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: "Veggie", price: 0.0038 },
        { menuId: 2, description: "Pepperoni", price: 0.0042 },
      ],
      storeId: "4",
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: "Veggie", price: 0.0038 },
          { menuId: 2, description: "Pepperoni", price: 0.0042 },
        ],
        storeId: "4",
        franchiseId: 2,
        id: 23,
      },
      jwt: "eyJpYXQ",
    };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto("/");

  // Go to order page
  await page.getByRole("button", { name: "Order now" }).click();

  // Create order
  await expect(page.locator("h2")).toContainText("Awesome is a click away");
  await page.getByRole("combobox").selectOption("4");
  await page.getByRole("link", { name: "Image Description Veggie A" }).click();
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await expect(page.locator("form")).toContainText("Selected pizzas: 2");
  await page.getByRole("button", { name: "Checkout" }).click();

  // Login
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").fill("d@jwt.com");
  await page.getByPlaceholder("Email address").press("Tab");
  await page.getByPlaceholder("Password").fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  // Pay
  await expect(page.getByRole("main")).toContainText("Send me those 2 pizzas right now!");
  await expect(page.locator("tbody")).toContainText("Veggie");
  await expect(page.locator("tbody")).toContainText("Pepperoni");
  await expect(page.locator("tfoot")).toContainText("0.008 ₿");
  await page.getByRole("button", { name: "Pay now" }).click();

  // Check balance
  await expect(page.getByText("0.008")).toBeVisible();
});

// Test for create franchise
test("create franchise", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      const loginReq = { email: "a@jwt.com", password: "admin" };
      const loginRes = {
        user: {
          id: 1,
          name: "常用名字",
          email: "a@jwt.com",
          roles: [{ role: "admin" }],
          token: randomToken(),
        },
      };
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });

  await page.route("*/**/api/franchise", async (route) => {
    if (route.request().method() === "POST") {
      const franchiseReq = { name: "PizzaHut" };
      const franchiseRes = {
        stores: [],
        name: "PizzaHut",
        id: 5,
        admins: [{ email: "h@test.com", id: 2, name: "hunter" }],
      };
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      await route.fulfill({ json: franchiseRes });
    } else {
      const franchiseRes = [
        {
          id: 1,
          name: "PizzaHut",
          admins: [{ email: "h@test.com", id: 2, name: "hunter" }],
          stores: [],
        },
      ];
      await route.fulfill({ json: franchiseRes });
    }
  });

  await page.goto("/");
  login(page, "a@jwt.com", "admin");
  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("button", { name: "Add Franchise" })).toBeVisible();
  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page.getByPlaceholder("franchise name").click();
  await page.getByPlaceholder("franchise name").fill("PizzaHut");
  await page.getByPlaceholder("franchisee admin email").click();
  await page.getByPlaceholder("franchisee admin email").fill("h@test.com");
  await expect(page.getByText("Want to create franchise?CreateCancel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("cell", { name: "PizzaHut" })).toBeVisible();
});

// Test for close franchise
test("close franchise", async ({ page }) => {
  let franchiseId;
  let franchiseDeleted = false;

  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      const loginReq = { email: "a@jwt.com", password: "admin" };
      const loginRes = {
        user: {
          id: 1,
          name: "常用名字",
          email: "a@jwt.com",
          roles: [{ role: "admin" }],
          token: randomToken(),
        },
      };
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });

  await page.route("*/**/api/franchise", async (route) => {
    if (route.request().method() === "POST") {
      const franchiseReq = { name: "PizzaHut" };
      const franchiseRes = {
        stores: [],
        name: "PizzaHut",
        id: 5,
        admins: [{ email: "h@test.com", id: 2, name: "hunter" }],
      };
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      franchiseId = franchiseRes.id;
      await route.fulfill({ json: franchiseRes });
    }
  });

  await page.route("*/**/api/franchise", async (route) => {
    if (route.request().method() === "GET") {
      if (franchiseDeleted) {
        await route.fulfill({ json: [] });
      } else {
        const franchiseRes = [
          {
            id: franchiseId,
            name: "PizzaHut",
            admins: [{ email: "h@test.com", id: 2, name: "hunter" }],
            stores: [],
          },
        ];
        await route.fulfill({ json: franchiseRes });
      }
    }
  });

  await page.route(`*/**/api/franchise/${franchiseId}`, async (route) => {
    if (route.request().method() === "DELETE") {
      const deleteRes = { message: "Franchise deleted" };
      franchiseDeleted = true;
      await route.fulfill({ json: deleteRes });
    }
  });

  await page.goto("http://localhost:5173/");
  await login(page, "a@jwt.com", "admin");
  await page.getByRole("link", { name: "Admin" }).click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Sorry to see you go")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("table")).not.toContainText("PizzaHut");
});
