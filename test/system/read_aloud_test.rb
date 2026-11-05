require "application_system_test_case"

class ReadAloudTest < ApplicationSystemTestCase
  test "users can reach read aloud from the home page and game menus" do
    visit root_url
    find("a.quest-card", text: "Read Aloud").click
    assert_text "WORD 1 OF 24"
    click_link "Choose a quest"
    assert_current_path root_path

    [ word_quest_url, math_quest_url ].each do |url|
      visit url
      find("nav a[aria-label='Read Aloud']").click
      assert_current_path read_aloud_path
      assert_text "WORD 1 OF 24"
    end
  end

  test "beginning words are first and each level has its word bank" do
    visit read_aloud_url

    assert_text "WORD 1 OF 24"
    assert_text "bed"
    fill_in "read-aloud-typed-input", with: "bed"
    click_button "Check"
    assert_text "Yes! bed is right."
    assert_text "WORD 2 OF 24", wait: 3

    click_button "Easy words"
    assert_text "WORD 1 OF 40"
    click_button "Medium words"
    assert_text "WORD 1 OF 40"
  end
end
