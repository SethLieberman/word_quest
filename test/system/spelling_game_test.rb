require "application_system_test_case"

class SpellingGameTest < ApplicationSystemTestCase
  Capybara.enable_aria_label = true

  setup do
    visit root_url
    page.execute_script("localStorage.clear()")
    visit root_url
  end

  test "solving a word, retrying, and saving progress" do
    assert_selector ".letter-slot", count: 6
    assert_button "Check my word", disabled: true
    page.find("body").send_keys("a")
    click_button "Check my word"
    assert_text "Not quite, little explorer."
    assert_selector "[data-game-target='garden'][data-growth='0']"
    assert_no_selector ".celebration-message"
    page.find("body").send_keys("b")
    click_button "Check my word"

    assert_text "You did it! RABBIT"
    assert_text "2 stars"
    assert_selector "[data-game-target='goalCount']", text: "1"
    assert_selector ".trail-stop.complete", count: 1
    assert_selector ".trail-stop.just-discovered", count: 1
    assert_selector "[data-game-target='garden'][data-growth='1']"
    assert_selector "[data-stage='1'].just-grown"
    assert_selector ".celebration-message", text: "One word stronger!"
    assert_selector ".confetti-piece", count: 12, visible: :all
    click_button "Next word"
    assert_text "WORD 2 OF 5"
    assert_no_selector ".celebration-message"
    assert_no_selector ".just-discovered"

    visit root_url
    assert_selector "[data-game-target='goalCount']", text: "1"
    assert_selector "[data-game-target='garden'][data-growth='1']"
    assert_no_selector ".just-grown"
    click_button "My progress"
    assert_selector "dialog[open]", text: "words discovered"
    assert_selector ".progress-stats strong", text: "2"
    click_button "Close progress"
    assert_no_selector "dialog[open]"
  end

  test "difficulty levels and hints complete a five-word adventure" do
    click_button "Word explorer"
    assert_selector ".letter-slot.missing", count: 2
    assert_no_selector ".frog-art"
    assert_selector ".word-emoji"
    click_button "Word wizard"
    assert_selector ".letter-slot.missing", count: 3

    5.times do |index|
      3.times { click_button "A little hint" }
      click_button "Check my word"
      assert_text "1 star for growing"
      assert_selector "[data-game-target='garden'][data-growth='#{index + 1}']"
      assert_selector "[data-stage='#{index + 1}'].just-grown"
      if index < 4
        click_button "Next word"
      else
        assert_text "Look how far you've grown!"
        assert_text "Daily goal complete"
        assert_selector ".trail-stop.complete", count: 5
        assert_text "Your word garden is in full bloom!"
        assert_selector "[data-finale='true']", text: "Five words! You bloomed!"
        assert_selector ".confetti-piece", count: 24, visible: :all
        click_button "Play again"
        assert_text "WORD 1 OF 5"
        assert_selector ".trail-stop.complete", count: 0
        assert_selector "[data-game-target='garden'][data-growth='5']"
        assert_no_selector ".celebration-message"
      end
    end
    assert_text "5 stars"
    assert_selector "[data-game-target='goalCount']", text: "5"
  end

  test "incorrect keyboard submissions do not advance multi-letter levels" do
    %w[medium hard advanced mastermind].each do |difficulty|
      level_button = find("[data-level='#{difficulty}']")
      level_button.click
      details = page.evaluate_script(<<~JS)
        (() => {
          const element = document.querySelector("[data-controller='game']");
          const game = window.Stimulus.getControllerForElementAndIdentifier(element, "game");
          const required = game.missing.map((index) => game.entry[0][index]);
          return {
            missing: game.missing.length,
            wrong: game.letters.find((letter) => !required.includes(letter)).toUpperCase()
          };
        })()
      JS
      wrong_letters = details.fetch("wrong").downcase * details.fetch("missing")
      level_button.send_keys(wrong_letters)
      level_button.send_keys(:enter)

      assert_text "Not quite, little explorer."
      assert_text "WORD 1 OF 5"
      assert_button "Check my word"
      assert_no_button "Next word"
    end
  end

  test "letter bank, editing blanks, instructions, and sound control" do
    click_button "Choose B"
    assert_selector ".letter-slot.missing", text: "B"
    page.find("body").send_keys(:backspace)
    assert_button "Check my word", disabled: true
    click_button "A little hint"
    find(".letter-slot.missing").send_keys(:enter)
    assert_text "1 star for growing"

    click_button "How to play"
    assert_selector "dialog[open]", text: "Ready for a word adventure?"
    click_button "Close instructions"
    click_button "Turn spoken words on"
    assert_selector "[data-game-target='soundButton'][aria-pressed='true']"
    click_button "Turn spoken words off"
    assert_selector "[data-game-target='soundButton'][aria-pressed='false']"
  end

  test "corrupt saved progress surfaces a notice without stopping play" do
    page.execute_script("localStorage.setItem('word-quest-progress-v1', '{broken')")
    visit root_url
    assert_text "Saved progress couldn't be loaded."
    assert_selector ".letter-slot.missing", count: 1
    click_button "Choose B"
    click_button "Check my word"
    assert_text "You did it! RABBIT"
  end

  test "beginner word banks are more challenging without adding blanks" do
    [ [ "Little sprout", 6..6, 1 ], [ "Word explorer", 7..8, 2 ] ].each do |level, length, blanks|
      click_button level
      words = []
      5.times do |index|
        assert_includes length, all(".letter-slot").length
        assert_selector ".letter-slot.missing", count: blanks
        blanks.times { click_button "A little hint" }
        words << all(".letter-slot").map(&:text).join
        click_button "Check my word"
        click_button "Next word" if index < 4
      end
      assert_equal 5, words.uniq.length
    end
  end

  test "reduced motion keeps progress visible without animations" do
    page.driver.browser.execute_cdp("Emulation.setEmulatedMedia", features: [ { name: "prefers-reduced-motion", value: "reduce" } ])
    click_button "A little hint"
    click_button "Check my word"
    assert_text "One word stronger!"
    assert_selector "[data-game-target='garden'][data-growth='1']"
    assert_equal "none", page.evaluate_script("getComputedStyle(document.querySelector('.just-grown')).animationName")
    assert_no_selector ".confetti"
  ensure
    page.driver.browser.execute_cdp("Emulation.setEmulatedMedia", features: [])
  end

  test "fourth grade adventure supports four blanks and preserves earned progress" do
    click_button "Word scholar"
    assert_selector "[data-level='advanced'][aria-pressed='true']"
    words = []
    5.times do |index|
      assert_selector ".letter-slot.missing", count: 4
      assert_includes 8..12, all(".letter-slot").length
      assert_button "Check my word", disabled: true
      assert_selector ".clue", text: /.+/
      4.times { click_button "A little hint" }
      words << all(".letter-slot").map(&:text).join.downcase
      click_button "Check my word"
      assert_text "1 star for growing"
      click_button "Next word" if index < 4
    end
    assert_equal 5, words.uniq.length
    assert_empty words - %w[beautiful necessary knowledge different important adventure dangerous surprise disappointed experiment]
    assert_text "Look how far you've grown!"
    assert_selector "[data-finale='true']", text: "Five words! You bloomed!"
    click_button "Play again"
    assert_selector ".letter-slot.missing", count: 4
    click_button "Little sprout"
    assert_selector ".letter-slot.missing", count: 1
    assert_text "5 stars"
    assert_selector "[data-game-target='garden'][data-growth='5']"
    visit root_url
    assert_text "5 stars"
    click_button "How to play"
    assert_text "Word scholar has four"
  end

  test "Mastermind reveals exactly two letters throughout a complete adventure" do
    click_button "Mastermind"
    assert_selector "[data-level='mastermind'][aria-pressed='true']"
    words = []
    5.times do |index|
      length = all(".letter-slot").length
      assert_includes 5..10, length
      assert_selector ".letter-slot:not(.missing)", count: 2
      assert_selector ".letter-slot.missing", count: length - 2
      assert_button "Check my word", disabled: true
      (length - 2).times { click_button "A little hint" }
      words << all(".letter-slot").map(&:text).join
      click_button "Check my word"
      assert_text "1 star for growing"
      click_button "Next word" if index < 4
    end
    assert_equal 5, words.uniq.length
    assert_selector "[data-finale='true']", text: "Five words! You bloomed!"
    click_button "Play again"
    assert_selector ".letter-slot:not(.missing)", count: 2
    click_button "Word scholar"
    assert_selector ".letter-slot.missing", count: 4
    assert_text "5 stars"
  end

  test "Mastermind supports five-letter and ten-letter words with a reusable letter bank" do
    click_button "Mastermind"
    %w[ocean dictionary].each do |word|
      page.execute_script(<<~JS, word)
        const element = document.querySelector("[data-controller='game']");
        const game = window.Stimulus.getControllerForElementAndIdentifier(element, "game");
        game.deck = [[arguments[0], "🧠", "A spelling challenge."]];
        game.completed = [];
        game.nextPuzzle();
      JS
      assert_selector ".letter-slot", count: word.length
      assert_selector ".letter-slot:not(.missing)", count: 2
      assert_selector ".letter-slot.missing", count: word.length - 2
      positions = all(".letter-slot.missing").map { |slot| slot["aria-label"][/\d+/].to_i }
      positions.each do |position|
        index = position - 1
        click_button "Missing letter #{position}", exact: true
        click_button "Choose #{word[index].upcase()}"
      end
      click_button "Check my word"
      assert_text "You did it! #{word.upcase()}"
      assert_text "2 stars for growing"
    end
    assert_text "4 stars"
  end

  test "desktop words stay on one line and follow the active blank while mobile words wrap" do
    click_button "Mastermind"
    page.execute_script(<<~JS)
      const element = document.querySelector("[data-controller='game']");
      const game = window.Stimulus.getControllerForElementAndIdentifier(element, "game");
      game.deck = [["dictionary", "📖", "A spelling challenge."]];
      game.completed = [];
      game.nextPuzzle();
    JS
    [ 801, 1400 ].each do |width|
      page.current_window.resize_to(width, 1000)
      assert_equal 1, page.evaluate_script("[...document.querySelectorAll('.letter-slot')].map(el => el.offsetTop).filter((top, index, rows) => rows.indexOf(top) === index).length")
      if width == 801
        assert page.evaluate_script("document.querySelector('.letter-slots').scrollWidth > document.querySelector('.letter-slots').clientWidth")
      end
      assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
    end
    blanks = all(".letter-slot.missing").length
    (blanks - 1).times { click_button "A little hint" }
    assert page.evaluate_script(<<~JS)
      (() => {
        const row = document.querySelector(".letter-slots").getBoundingClientRect();
        const tile = document.querySelector(".letter-slot.focused").getBoundingClientRect();
        return tile.left >= row.left && tile.right <= row.right;
      })()
    JS
    click_button "A little hint"
    click_button "Check my word"
    assert_text "You did it!"
    page.current_window.resize_to(320, 812)
    assert page.evaluate_script("new Set([...document.querySelectorAll('.letter-slot')].map(el => el.offsetTop)).size > 1")
    assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
  ensure
    page.current_window.resize_to(1400, 1400)
  end
end
