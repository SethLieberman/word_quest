require "application_system_test_case"

class WordleWednesdayTest < ApplicationSystemTestCase
  test "landing page opens the game and navigation returns to all listed games" do
    visit root_url
    find("a.quest-card", text: "Wordle Wednesday").click

    assert_current_path wordle_wednesday_path
    assert_text "Guess the secret five-letter word in six tries."
    assert_selector ".wordle-row", count: 6
    assert_selector ".wordle-key", count: 28
    click_link "Choose a quest"
    assert_current_path root_path
    assert_selector ".quest-card", count: 8
  end

  test "guesses mark duplicate letters correctly, hints work once, and a correct word ends the round" do
    visit wordle_wednesday_url
    page.execute_script("#{controller_script}.answer = {word: 'APPLE', hint: 'A crunchy fruit.'}")

    fill_in "Your five-letter guess", with: "ALLEY"
    click_button "Guess"
    row = all(".wordle-row").first
    assert_equal %w[correct present absent present absent], row.all(".wordle-tile").map { |tile| tile["class"].split.last }
    assert_text "5 guesses left"

    click_button "Get a hint"
    assert_text "Hint: A crunchy fruit."
    assert_button "Get a hint", disabled: true

    fill_in "Your five-letter guess", with: "APPLE"
    click_button "Guess"
    assert_text "You got it! APPLE"
    assert_button "Play another word"
    assert_selector ".wordle-row:nth-child(2) .wordle-tile.correct", count: 5
    assert_selector "#wordle-guess[disabled]"
  end

  test "short guesses do not use a turn and the sixth incorrect guess reveals the word" do
    visit wordle_wednesday_url
    page.execute_script("#{controller_script}.answer = {word: 'APPLE', hint: 'A crunchy fruit.'}")

    fill_in "Your five-letter guess", with: "CAT"
    click_button "Guess"
    assert_text "Type five letters to make your guess."
    assert_text "6 guesses left"
    assert_selector "[aria-invalid='true']"

    %w[CRANE BRICK CLOUD TIGER LEMON].each do |guess|
      fill_in "Your five-letter guess", with: guess
      click_button "Guess"
    end
    fill_in "Your five-letter guess", with: "GRAPE"
    click_button "Guess"

    assert_text "Nice try! The word was APPLE."
    assert_text "ROUND COMPLETE"
    assert_button "Play another word"
    assert_selector "#wordle-guess[disabled]"
  end

  test "on-screen keyboard enters letters and another round uses a different word" do
    visit wordle_wednesday_url
    answer = page.evaluate_script("#{controller_script}.answer.word")
    answer.chars.each { |letter| find(".wordle-key[data-key='#{letter}']").click }
    find(".wordle-key[data-key='ENTER']").click
    assert_text "You got it!"

    click_button "Play another word"
    assert_text "YOUR WORD"
    assert_equal "", find("#wordle-guess").value
    assert_not_equal answer, page.evaluate_script("#{controller_script}.answer.word")
    assert_button "Get a hint", disabled: false
  end

  private

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'wordle-wednesday\']"), "wordle-wednesday")'
  end
end
