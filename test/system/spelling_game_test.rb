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
    assert_no_selector "[data-stage='1']"
    assert_selector ".celebration-message", text: "One word stronger!"
    assert_selector ".confetti-piece", count: 12, visible: :all
    click_button "Next word"
    assert_text "WORD 2 OF 10"
    assert_no_selector ".celebration-message"
    assert_no_selector ".just-discovered"

    visit root_url
    assert_selector "[data-game-target='goalCount']", text: "0", exact_text: true
    assert_selector "[data-game-target='garden'][data-growth='0']"
    assert_no_selector ".just-grown"
    click_button "My progress"
    assert_selector "dialog[open]", text: "words discovered"
    assert_selector ".progress-stats strong", text: "2"
    click_button "Close progress"
    assert_no_selector "dialog[open]"
  end

  test "difficulty levels and hints complete a ten-word adventure" do
    click_button "Word explorer"
    assert_selector ".letter-slot.missing", count: 2
    assert_no_selector ".frog-art"
    assert_selector ".word-emoji"
    click_button "Word wizard"
    assert_selector ".letter-slot.missing", count: 3

    10.times do |index|
      3.times { click_button "A little hint" }
      click_button "Check my word"
      assert_text "1 star for growing"
      assert_selector "[data-game-target='garden'][data-growth='#{index + 1}']"
      assert_selector "[data-game-target='goalBar'][aria-valuenow='#{index + 1}'][aria-valuemax='10']"
      assert_equal "#{(index + 1) * 10}%", page.evaluate_script("document.querySelector('[data-game-target=\"goalFill\"]').style.width")
      if (index + 1).even?
        assert_selector "[data-stage='#{(index + 1) / 2}'].just-grown"
      else
        assert_no_selector ".just-grown"
      end
      if index < 9
        assert_no_text "Adventure goal complete"
        assert_no_selector "[data-finale='true']"
        assert_no_text "Try Word scholar next!"
        assert_no_selector "[data-stage='5']"
        click_button "Next word"
      else
        assert_text "Look how far you've grown!"
        assert_text "Try Word scholar next!"
        assert_selector "[data-level='hard'][aria-pressed='true']"
        assert_text "Adventure goal complete"
        assert_selector ".trail-stop.complete", count: 10
        assert_selector "[data-game-target='trailCount']", text: "10 of 10 discovered"
        assert_text "Your word garden is in full bloom!"
        assert_selector "[data-finale='true']", text: "Ten words! You bloomed!"
        assert_selector ".confetti-piece", count: 24, visible: :all
        click_button "Play again"
        assert_text "WORD 1 OF 10"
        assert_selector ".trail-stop.complete", count: 0
        assert_selector "[data-game-target='garden'][data-growth='0']"
        assert_no_selector ".celebration-message"
        assert_no_text "Try Word scholar next!"
      end
    end
    assert_text "10 stars"
    assert_selector "[data-game-target='goalCount']", text: "0", exact_text: true
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
      assert_text "WORD 1 OF 10"
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

  test "saved daily totals do not fill a new adventure goal or lose earned progress" do
    page.execute_script(<<~JS)
      const date = new Date();
      const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      localStorage.setItem("word-quest-progress-v1", JSON.stringify({ total: 20, stars: 40, days: { [day]: 20 } }));
    JS
    visit root_url
    assert_text "40 stars"
    assert_selector "[data-game-target='goalCount']", text: "0", exact_text: true
    assert_selector "[data-game-target='goalBar'][aria-valuenow='0'][aria-valuemax='10']"
    assert_equal "0%", page.evaluate_script("document.querySelector('[data-game-target=\"goalFill\"]').style.width")
    assert_no_selector "[data-stage='1']"
    assert_no_selector ".just-grown"
    assert_no_text "Adventure goal complete"
    assert_selector ".trail-stop", count: 10
    assert_selector ".trail-stop.complete", count: 0

    click_button "A little hint"
    click_button "Check my word"
    assert_text "41 stars"
    assert_selector "[data-game-target='goalCount']", text: "1", exact_text: true
    click_button "Next word"
    assert_selector "[data-game-target='goalCount']", text: "1", exact_text: true
    click_button "Word explorer"
    assert_selector "[data-game-target='goalCount']", text: "0", exact_text: true
    assert_selector "[data-game-target='garden'][data-growth='0']"
    assert_equal "0%", page.evaluate_script("document.querySelector('[data-game-target=\"goalFill\"]').style.width")
    visit root_url
    assert_text "41 stars"
    assert_selector "[data-game-target='goalCount']", text: "0", exact_text: true
    assert_no_selector ".just-grown"
    saved = page.evaluate_script("JSON.parse(localStorage.getItem('word-quest-progress-v1'))")
    assert_equal 21, saved.fetch("total")
    assert_equal 41, saved.fetch("stars")
    assert_equal [ 21 ], saved.fetch("days").values
  end

  test "beginner word banks are more challenging without adding blanks" do
    [ [ "Little sprout", 6..6, 1 ], [ "Word explorer", 7..8, 2 ] ].each do |level, length, blanks|
      click_button level
      words = []
      10.times do |index|
        assert_includes length, all(".letter-slot").length
        assert_selector ".letter-slot.missing", count: blanks
        blanks.times { click_button "A little hint" }
        words << all(".letter-slot").map(&:text).join
        click_button "Check my word"
        click_button "Next word" if index < 9
      end
      assert_equal 10, words.uniq.length
    end
  end

  test "bundled vocabulary has valid entries and licensed New Dolch additions" do
    vocabulary = page.driver.browser.execute_async_script(<<~JS)
      const done = arguments[0];
      Promise.all([import("data/game_words"), import("data/new_dolch_words")])
        .then(([game, dolch]) => done({ banks: game.default, additions: dolch.default }))
        .catch((error) => done({ error: error.message }));
    JS
    assert_nil vocabulary["error"]
    source_words = File.read(Rails.root.join("vendor/data/new_dolch/words.csv")).scan(/^\d+\.,([^,\r\n]+),/).flatten
    assert_equal 874, source_words.length
    assert_equal source_words.length, source_words.uniq.length
    candidates = source_words.grep(/\A[a-z]+\z/)
    assert_equal 120, candidates.count { |word| word.length == 6 }
    assert_equal 107, candidates.count { |word| (7..8).cover?(word.length) }

    lengths = { "easy" => 6..6, "medium" => 7..8, "hard" => 7..10, "advanced" => 8..12, "mastermind" => 5..10, "jumble" => 5..10 }
    counts = { "easy" => 40, "medium" => 40, "hard" => 30, "advanced" => 30, "mastermind" => 31, "jumble" => 31 }
    assert_equal counts.keys.sort, vocabulary.fetch("banks").keys.sort
    vocabulary.fetch("banks").each do |level, entries|
      assert_equal counts.fetch(level), entries.length
      words = entries.map(&:first)
      assert_equal words.uniq, words, "Duplicate words in #{level}"
      entries.each do |entry|
        assert_equal 3, entry.length
        word, emoji, clue = entry
        assert_match(/\A[a-z]+\z/, word)
        assert_includes lengths.fetch(level), word.length
        assert emoji.present?, "Missing emoji for #{word}"
        assert clue.present?, "Missing clue for #{word}"
      end
    end
    assert_equal vocabulary.fetch("banks").fetch("mastermind"), vocabulary.fetch("banks").fetch("jumble")

    assert_equal %w[easy medium], vocabulary.fetch("additions").keys.sort
    vocabulary.fetch("additions").each do |level, entries|
      assert_equal 30, entries.length
      entries.each do |entry|
        assert_includes source_words, entry.first
        assert_includes vocabulary.fetch("banks").fetch(level), entry
      end
    end
  end

  test "every new advanced word can be solved with the existing hints and scoring" do
    results = page.driver.browser.execute_async_script(<<~JS)
      const done = arguments[0];
      import("data/game_words").then(({ default: banks }) => {
        const element = document.querySelector("[data-controller='game']");
        const game = window.Stimulus.getControllerForElementAndIdentifier(element, "game");
        const results = [];
        for (const [level, offset] of [["hard", 10], ["advanced", 10], ["mastermind", 11], ["jumble", 11]]) {
          game.startAdventure(level);
          for (const entry of banks[level].slice(offset)) {
            game.deck = [entry];
            game.completed = [];
            game.nextPuzzle();
            const blanks = game.missing.length;
            const stars = game.progress.stars;
            for (let index = 0; index < blanks; index++) game.hint();
            game.check();
            results.push({
              level, word: entry[0], blanks,
              spelled: game.slotsTarget.textContent.toLowerCase(),
              solved: game.solved,
              stars: game.progress.stars - stars,
              completed: game.completed.length
            });
          }
        }
        done({ results });
      }).catch((error) => done({ error: error.message }));
    JS
    assert_nil results["error"]
    assert_equal 80, results.fetch("results").length
    results.fetch("results").each do |result|
      word = result.fetch("word")
      expected_blanks = case result.fetch("level")
      when "hard" then 3
      when "advanced" then 4
      when "mastermind" then word.length - 2
      when "jumble" then word.length
      end
      assert_equal expected_blanks, result.fetch("blanks"), word
      assert_equal word, result.fetch("spelled"), word
      assert result.fetch("solved"), word
      assert_equal 1, result.fetch("stars"), word
      assert_equal 1, result.fetch("completed"), word
    end
  end

  test "New Dolch words support complete beginner adventures" do
    [ [ "Little sprout", "easy", 1 ], [ "Word explorer", "medium", 2 ] ].each do |level, difficulty, blanks|
      click_button level
      result = page.driver.browser.execute_async_script(<<~JS, difficulty)
        const difficulty = arguments[0];
        const done = arguments[1];
        import("data/new_dolch_words").then(({ default: words }) => {
          const element = document.querySelector("[data-controller='game']");
          const game = window.Stimulus.getControllerForElementAndIdentifier(element, "game");
          game.deck = words[difficulty].slice(0, 10);
          game.completed = [];
          game.nextPuzzle();
          done({ words: game.deck });
        }).catch((error) => done({ error: error.message }));
      JS
      assert_nil result["error"]
      result.fetch("words").each_with_index do |(word, emoji, clue), index|
        assert_selector ".clue", text: clue
        assert_selector ".word-emoji", text: emoji
        assert_selector ".letter-slot.missing", count: blanks
        blanks.times { click_button "A little hint" }
        click_button "Check my word"
        assert_text "You did it! #{word.upcase()}"
        click_button "Next word" if index < 9
      end
      assert_selector ".trail-stop.complete", count: 10
      next_level = difficulty == "easy" ? "Word explorer" : "Word wizard"
      assert_text "Try #{next_level} next!"
      assert_selector "[data-level='#{difficulty}'][aria-pressed='true']"
      assert_button "Play again"
    end
    assert_text "20 stars"
    assert_selector "[data-game-target='goalCount']", text: "10"
    assert_selector "[data-game-target='goalBar'][aria-valuenow='10']"
  end

  test "reduced motion keeps progress visible without animations" do
    page.driver.browser.execute_cdp("Emulation.setEmulatedMedia", features: [ { name: "prefers-reduced-motion", value: "reduce" } ])
    click_button "A little hint"
    click_button "Check my word"
    assert_text "One word stronger!"
    assert_selector "[data-game-target='garden'][data-growth='1']"
    assert_equal "none", page.evaluate_script("getComputedStyle(document.querySelector('.celebration-message')).animationName")
    assert_no_selector ".confetti"
  ensure
    page.driver.browser.execute_cdp("Emulation.setEmulatedMedia", features: [])
  end

  test "fourth grade adventure supports four blanks and preserves earned progress" do
    click_button "Word scholar"
    assert_selector "[data-level='advanced'][aria-pressed='true']"
    words = []
    10.times do |index|
      assert_selector ".letter-slot.missing", count: 4
      assert_includes 8..12, all(".letter-slot").length
      assert_button "Check my word", disabled: true
      assert_selector ".clue", text: /.+/
      4.times { click_button "A little hint" }
      words << all(".letter-slot").map(&:text).join.downcase
      click_button "Check my word"
      assert_text "1 star for growing"
      click_button "Next word" if index < 9
    end
    assert_equal 10, words.uniq.length
    assert_text "Look how far you've grown!"
    assert_selector "[data-finale='true']", text: "Ten words! You bloomed!"
    assert_text "Try Mastermind next!"
    click_button "Play again"
    assert_selector ".letter-slot.missing", count: 4
    click_button "Little sprout"
    assert_selector ".letter-slot.missing", count: 1
    assert_text "10 stars"
    assert_selector "[data-game-target='garden'][data-growth='0']"
    visit root_url
    assert_text "10 stars"
    click_button "How to play"
    assert_text "Word scholar has four"
  end

  test "Mastermind reveals exactly two letters throughout a complete adventure" do
    click_button "Mastermind"
    assert_selector "[data-level='mastermind'][aria-pressed='true']"
    words = []
    10.times do |index|
      length = all(".letter-slot").length
      assert_includes 5..10, length
      assert_selector ".letter-slot:not(.missing)", count: 2
      assert_selector ".letter-slot.missing", count: length - 2
      assert_button "Check my word", disabled: true
      (length - 2).times { click_button "A little hint" }
      words << all(".letter-slot").map(&:text).join
      click_button "Check my word"
      assert_text "1 star for growing"
      click_button "Next word" if index < 9
    end
    assert_equal 10, words.uniq.length
    assert_selector "[data-finale='true']", text: "Ten words! You bloomed!"
    assert_text "Try Word jumble next!"
    assert_selector "[data-level='mastermind'][aria-pressed='true']"
    assert_no_text "Try Mastermind next!"
    click_button "Play again"
    assert_selector ".letter-slot:not(.missing)", count: 2
    click_button "Word scholar"
    assert_selector ".letter-slot.missing", count: 4
    assert_text "10 stars"
  end

  test "Word jumble conserves repeated tiles while editing and correcting a wrong answer" do
    click_button "Word jumble"
    page.execute_script(<<~JS)
      const element = document.querySelector("[data-controller='game']");
      const game = window.Stimulus.getControllerForElementAndIdentifier(element, "game");
      game.deck = [["treasure", "💎", "A pirate's hidden collection."]];
      game.completed = [];
      game.nextPuzzle();
    JS
    assert_selector ".letter-slot.missing", count: 8
    assert_selector ".letter-slot:not(.missing)", count: 0
    tiles = all(".letter-choice").map(&:text)
    assert_equal "TREASURE".chars.sort, tiles.sort
    assert_not_equal "TREASURE", tiles.join
    assert_selector ".letter-choice", text: "R", exact_text: true, count: 2

    all(".letter-choice", text: "R", exact_text: true).first.click
    assert_selector ".letter-choice:disabled", text: "R", exact_text: true, count: 1
    page.find("body").send_keys("r")
    assert_selector ".letter-choice:disabled", text: "R", exact_text: true, count: 2
    page.find("body").send_keys("r")
    assert_text "Use an available tile"
    assert_selector ".letter-slot.missing", text: "R", exact_text: true, count: 2
    page.find("body").send_keys(:backspace)
    assert_selector ".letter-choice:not(:disabled)", text: "R", exact_text: true, count: 1
    click_button "Missing letter 1: R", exact: true
    assert_selector ".letter-choice:disabled", count: 0

    tiles.each do |letter|
      all(".letter-choice:not(:disabled)", text: letter, exact_text: true).first.click
    end
    assert_button "Check my word", disabled: false
    page.find("body").send_keys(:enter)
    assert_text "Not quite, little explorer."
    assert_text "WORD 1 OF 10"
    assert_selector ".letter-choice:disabled", count: 8
    assert_text "0 stars"

    8.times do
      previous = all(".letter-slot").map(&:text)
      click_button "A little hint"
      current = all(".letter-slot").map(&:text)
      "TREASURE".chars.each_with_index do |letter, index|
        assert_equal letter, current[index] if previous[index] == letter
      end
    end
    assert_equal "TREASURE", all(".letter-slot").map(&:text).join
    assert_selector ".letter-choice:disabled", count: 8
    click_button "Check my word"
    assert_text "You did it! TREASURE"
    assert_text "1 star for growing"
    assert_selector "[data-game-target='goalCount']", text: "1", exact_text: true
    click_button "Mastermind"
    assert_selector ".letter-slot:not(.missing)", count: 2
    assert_selector ".letter-choice:disabled", count: 0
  end

  test "Word jumble completes ten distinct words and celebrates the highest level" do
    click_button "Word jumble"
    words = []
    10.times do |index|
      word = page.evaluate_script("document.querySelector('[data-game-target=\"scene\"]').getAttribute('aria-label').replace('Picture clue: ', '')")
      words << word
      assert_selector ".letter-slot.missing", count: word.length
      assert_selector ".letter-choice", count: word.length
      assert_equal word.chars.sort, all(".letter-choice").map { |tile| tile.text.downcase }.sort
      assert_not_equal word, all(".letter-choice").map { |tile| tile.text.downcase }.join
      if index.zero?
        page.find("body").send_keys(word, :enter)
        assert_text "2 stars for growing"
      else
        word.length.times { click_button "A little hint" }
        click_button "Check my word"
        assert_text "1 star for growing"
      end
      click_button "Next word" if index < 9
    end
    assert_equal 10, words.uniq.length
    assert_text "Congratulations, you've completed the highest level!"
    assert_selector "[data-level='jumble'][aria-pressed='true']"
    assert_selector ".trail-stop.complete", count: 10
    assert_selector "[data-finale='true']", text: "Ten words! You bloomed!"
    assert_text "11 stars"
    click_button "Play again"
    assert_text "WORD 1 OF 10"
    assert_no_text "Congratulations"
    assert_selector ".letter-choice:disabled", count: 0
    assert_selector "[data-game-target='goalCount']", text: "0", exact_text: true
    visit root_url
    assert_text "11 stars"
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
    assert_selector ".trail-stop", count: 10
    assert_equal 2, page.evaluate_script("new Set([...document.querySelectorAll('.trail-stop')].map(el => el.getBoundingClientRect().top)).size")
    assert page.evaluate_script(<<~JS)
      (() => {
        const trail = document.querySelector(".trail").getBoundingClientRect();
        return [...document.querySelectorAll(".trail-circle")].every((circle) => {
          const tile = circle.getBoundingClientRect();
          return tile.left >= trail.left && tile.right <= trail.right;
        });
      })()
    JS
    assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
    click_button "Word jumble"
    assert_text "Can you unscramble the word?"
    assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
    assert page.evaluate_script(<<~JS)
      [...document.querySelectorAll(".letter-choice")].every((tile) => {
        const bounds = tile.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth;
      })
    JS
  ensure
    page.current_window.resize_to(1400, 1400)
  end
end
