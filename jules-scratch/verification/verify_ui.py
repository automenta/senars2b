from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Listen for console events and print them
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    try:
        page.goto("http://localhost:5173/", timeout=60000)

        # Go to tasks view
        page.get_by_role("button", name="Tasks").click(timeout=60000)

        # Add a new task
        page.get_by_role("button", name="Add Task").click()
        page.get_by_placeholder("Task Title").fill("My New Task")
        page.get_by_placeholder("Task Description").fill("This is a test task.")
        page.get_by_role("combobox").select_option("HIGH")
        page.get_by_role("button", name="Add Task").click()

        # Filter for the new task
        page.get_by_role("button", name="Pending").click()
        expect(page.get_by_text("My New Task")).to_be_visible()

        # Select the task
        page.get_by_text("My New Task").click()

        # Go to dashboard
        page.get_by_role("button", name="Dashboard").click()

        # Wait for charts to be visible
        expect(page.get_by_text("Tasks by Status")).to_be_visible()
        expect(page.get_by_text("Tasks by Priority")).to_be_visible()

        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
