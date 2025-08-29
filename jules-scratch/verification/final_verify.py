from playwright.sync_api import sync_playwright, Page, expect
import time

def run_verification(page: Page):
    """
    Performs a final, comprehensive verification of all new UI features.
    """
    print("Navigating to the dashboard at http://localhost:5173/...")
    page.goto("http://localhost:5173/")

    # 1. Verify Stats Panel
    print("Verifying Stats Panel...")
    stats_button = page.get_by_role("button", name="System Statistics")
    expect(stats_button).to_be_visible(timeout=15000)

    # Check that stats are not visible initially
    expect(page.get_by_text("Total:")).not_to_be_visible()

    stats_button.click()
    expect(page.get_by_text("Total:")).to_be_visible()
    print("Stats panel opened successfully.")
    page.screenshot(path="jules-scratch/verification/01_stats_panel_open.png")

    # 2. Verify Add Task Modal
    print("Verifying Add Task Modal...")
    add_task_button = page.get_by_role("button", name="Add Task")
    add_task_button.click()

    modal_title = page.get_by_role("heading", name="Add New Task")
    expect(modal_title).to_be_visible()
    print("Add Task modal opened.")

    # Check for progressive disclosure
    expect(page.get_by_placeholder("Description")).not_to_be_visible()
    page.get_by_role("button", name="Add Details").click()
    expect(page.get_by_placeholder("Description")).to_be_visible()
    print("Progressive disclosure in modal works.")

    # Fill out and submit the form
    page.get_by_placeholder("Task Title").fill("My New Test Task")
    page.get_by_placeholder("Description").fill("This is a test description.")
    page.get_by_role("button", name="Create Task").click()

    expect(modal_title).not_to_be_visible()
    expect(page.get_by_text("My New Test Task")).to_be_visible()
    print("Successfully added a new task via modal.")
    page.screenshot(path="jules-scratch/verification/02_task_added.png")

    # 3. Verify Subtask Visualization
    print("Verifying subtask visualization...")
    parent_task = page.get_by_text("First Task: Review the new UI design")
    subtask = page.get_by_text("Subtask: Implement the WebSocket connection")

    expect(parent_task).to_be_visible()
    expect(subtask).not_to_be_visible()
    print("Subtask is initially hidden.")

    # Find the expand button within the parent task's scope and click it
    parent_task_element = page.locator(".task-item-container", has_text="First Task")
    expand_button = parent_task_element.get_by_role("button").first # The expand button is the first button
    expand_button.click()

    expect(subtask).to_be_visible()
    print("Subtask is visible after expanding.")
    page.screenshot(path="jules-scratch/verification/03_subtask_visible.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
            print("Final verification script completed successfully!")
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
