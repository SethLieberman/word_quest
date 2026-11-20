require "application_system_test_case"

class TwentyFourTest < ApplicationSystemTestCase
  test "practice uses all four cards, allows fractions, and can undo" do
    visit twenty_four_url
    assert_text "No timer"
    assert_selector ".twenty-four-card", count: 4
    assert_no_selector ".twenty-four-card.is-hidden"

    page.execute_script("#{controller_script}.startNewDeal([3, 3, 8, 8])")
    combine_cards(2, 0, "÷")
    assert_selector ".twenty-four-card", count: 3
    assert_text "3 cards left"
    click_button "Undo move"
    assert_selector ".twenty-four-card", count: 4

    page.execute_script("#{controller_script}.startNewDeal([3, 3, 8, 8])")
    combine_cards(2, 0, "÷")
    combine_cards(1, 4, "-")
    combine_cards(3, 5, "÷")

    assert_text "You made 24!"
    assert_selector ".twenty-four-card", count: 1
    assert_selector ".twenty-four-moves li", count: 3
    assert_text "No timer"
  end

  test "timed mode hides cards until start, then flips them and starts the clock" do
    visit twenty_four_url
    click_button "Timed"

    assert_selector ".twenty-four-card.is-hidden", count: 4
    assert_text "Ready"
    assert_button "Start timer and reveal cards"

    click_button "Start timer and reveal cards"
    assert_no_selector ".twenty-four-card.is-hidden"
    assert_button "New timed deal"
    assert_no_text "Ready"
    assert_match(/\A\d{2}:\d{2}\.\d\z/, find("[data-twenty-four-target='timer']").text)

    click_button "New timed deal"
    assert_selector ".twenty-four-card", count: 4
    assert_no_selector ".twenty-four-card.is-hidden"
    click_button "Practice"
    assert_text "No timer"
    assert_selector "[data-mode='practice'][aria-pressed='true']"
    assert_no_selector ".twenty-four-card.is-hidden"
  end

  test "typed equations require every original card and accept exact fractions" do
    visit twenty_four_url
    page.execute_script("#{controller_script}.startNewDeal([3, 3, 8, 8])")
    [ "24", "8*3", "8/(3-3)+8", "8/(3-8/3)+1", "alert(8)" ].each do |answer|
      fill_in "Or type your equation", with: answer
      click_button "Check equation"
      assert_selector "#twenty-four-answer[aria-invalid='true']"
      assert_no_text "You made 24!"
    end

    combine_cards(2, 0, "÷")
    fill_in "Or type your equation", with: "8 / (3 - 8 / 3) = 24"
    click_button "Check equation"
    assert_text "You made 24!"
    assert_field "Or type your equation", disabled: true
    click_button "New deal"
    assert_field "Or type your equation", with: "", disabled: false
  end

  test "typed answer waits for timed start and stops the timer when correct" do
    visit twenty_four_url
    click_button "Timed"
    assert_field "Or type your equation", disabled: true
    click_button "Start timer and reveal cards"
    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.deal = [3, 3, 8, 8];
    JS
    fill_in "Or type your equation", with: "8/(3-8/3)"
    click_button "Check equation"
    assert_text "You made 24 in"
    assert page.evaluate_script("#{controller_script}.timerInterval === null")
    assert_field "Or type your equation", disabled: true
  end

  test "generated deals contain four solvable numbers from one through nine" do
    visit twenty_four_url
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/twenty_four").then(({ createDeal, canMakeTwentyFour }) => {
        const deals = Array.from({ length: 40 }, () => createDeal());
        done({
          valid: deals.every((deal) => deal.length === 4 && deal.every((number) => number >= 1 && number <= 9) && canMakeTwentyFour(deal))
        });
      }).catch((error) => done({ error: error.message }));
    JS

    assert_nil report["error"]
    assert report.fetch("valid")
  end

  test "the four-card board and controls fit a narrow screen" do
    visit twenty_four_url
    page.current_window.resize_to(320, 900)

    assert page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")
    click_button "Timed"
    click_button "Start timer and reveal cards"
    assert page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")
  ensure
    page.current_window.resize_to(1400, 1000)
  end

  private

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'twenty-four\']"), "twenty-four")'
  end

  def combine_cards(left_id, right_id, operation)
    find("[data-card-id='#{left_id}']").click
    find("[data-card-id='#{right_id}']").click
    find("[data-operation='#{operation}']").click
    click_button "Combine cards"
  end
end
