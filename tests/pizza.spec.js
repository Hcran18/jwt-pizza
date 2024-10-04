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
  return Math.random().toString(36).substr(2);
}

// Helper function: Set up routes for login and other API requests
async function setupCommonRoutes(page) {
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
    } else {
      // Proceed to the next mock in case this is not a login request
      route.continue();
    }
  });

  // Mock register route (POST)
  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "POST") {
      const registerReq = { name: "David Wallace", email: "w@jwt.com", password: "c" };
      const registerRes = {
        user: { id: 3, name: "David Wallace", email: "w@jwt.com", roles: [{ role: "diner" }] },
        token: randomToken(),
      };
      expect(route.request().postDataJSON()).toMatchObject(registerReq);
      await route.fulfill({ json: registerRes });
    } else {
      // Proceed to the next mock in case this is not a register request
      route.continue();
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
}

// Helper function: Set up order route
async function setupOrderRoute(page) {
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
}

// Test for home page
test("home page", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("JWT Pizza");
});

// Test for login functionality
test("login", async ({ page }) => {
  await setupCommonRoutes(page);
  await login(page, "d@jwt.com", "a");
  await expect(page.getByRole("link", { name: "KC" })).toBeVisible(); // Check if user info is visible
});

// Test for registration functionality
test("register", async ({ page }) => {
  await setupCommonRoutes(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await expect(page.getByPlaceholder("Full name")).toBeVisible();
  await page.getByPlaceholder("Full name").fill("David Wallace");
  await page.getByPlaceholder("Email address").fill("w@jwt.com");
  await page.getByPlaceholder("Password").fill("c");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("link", { name: "DW" })).toBeVisible(); // Check if user info is visible
});

// Test for purchase with login
test("purchase with login", async ({ page }) => {
  await setupCommonRoutes(page);
  await setupOrderRoute(page);

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
