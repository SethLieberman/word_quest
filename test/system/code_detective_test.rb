require "application_system_test_case"

class CodeDetectiveTest < ApplicationSystemTestCase
  setup do
    visit code_breaker_url
    select "Code Detective", from: "Code type"
  end

  test "each level generates ten distinct valid secrets including repeatable hard codes" do
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/code_detective").then(({detectiveRound, detectiveSettings}) => {
        const results = [];
        const random = Math.random;
        try {
          for (const level of ["easy", "medium", "hard"]) {
            for (const value of [0, 0.999999, null]) {
              Math.random = value === null ? random : () => value;
              for (let round = 0; round < 10; round++) {
                results.push({ level, settings: detectiveSettings(level), deck: detectiveRound(level) });
              }
            }
          }
        } finally { Math.random = random; }
        let invalid = false;
        try { detectiveRound("unknown"); } catch (error) { invalid = error.message.includes("Unknown detective level"); }
        done({results, invalid});
      }).catch((error) => done({error: error.message}));
    JS
    assert_nil report["error"]
    assert report.fetch("invalid")
    assert_equal 90, report.fetch("results").length
    report.fetch("results").each do |result|
      settings = result.fetch("settings")
      expected_length = result.fetch("level") == "easy" ? 3 : 4
      expected_symbols = result.fetch("level") == "easy" ? 4 : 6
      assert_equal expected_length, settings.fetch("length")
      assert_equal expected_symbols, settings.fetch("symbols").length
      assert_equal(result.fetch("level") == "hard", settings.fetch("repeats"))
      deck = result.fetch("deck")
      assert_equal 10, deck.length
      assert_equal 10, deck.uniq.length
      deck.each do |secret|
        assert_equal expected_length, secret.length
        assert_empty secret - settings.fetch("symbols").map { |symbol| symbol.fetch("id") }
        assert_equal secret.length, secret.uniq.length unless settings.fetch("repeats")
      end
    end
    hard = report.fetch("results").find { |result| result.fetch("level") == "hard" }
    assert_equal 1, hard.fetch("deck").first.uniq.length
  end

  test "scoring counts exact matches first and never overcounts repeated symbols" do
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/code_detective").then(({scoreGuess}) => {
        const symbols = ["star", "circle", "heart"];
        const codes = [];
        for (const a of symbols) for (const b of symbols) for (const c of symbols) for (const d of symbols) codes.push([a,b,c,d]);
        const errors = [];
        for (const secret of codes) for (const guess of codes) {
          const before = JSON.stringify([secret, guess]);
          const exact = secret.filter((id, index) => id === guess[index]).length;
          const total = symbols.reduce((sum, id) => sum + Math.min(
            secret.filter((symbol) => symbol === id).length,
            guess.filter((symbol) => symbol === id).length
          ), 0);
          const actual = scoreGuess(secret, guess);
          if (actual.exact !== exact || actual.misplaced !== total - exact || before !== JSON.stringify([secret, guess])) {
            errors.push({secret, guess, actual, exact, total});
          }
        }
        const invalid = [
          [[], []], [["star"], ["star"]], [["star", "circle", "triangle"], ["star", "circle"]],
          [["star", "circle", "triangle"], ["star", "circle", "invalid"]], [null, codes[0]]
        ].map(([secret, guess]) => {
          try { scoreGuess(secret, guess); return false; } catch (error) { return error.message.includes("detective guess"); }
        });
        done({
          errors, checked: codes.length ** 2, invalid,
          easy: scoreGuess(["star", "circle", "triangle"], ["triangle", "star", "circle"]),
          partial: scoreGuess(["star", "star", "circle", "triangle"], ["star", "circle", "star", "star"]),
          excessive: scoreGuess(["star", "circle", "triangle", "square"], ["star", "star", "star", "star"])
        });
      }).catch((error) => done({error: error.message}));
    JS
    assert_nil report["error"]
    assert_equal 6561, report.fetch("checked")
    assert_empty report.fetch("errors")
    assert_equal [ true ] * 5, report.fetch("invalid")
    assert_equal({ "exact" => 0, "misplaced" => 3 }, report.fetch("easy"))
    assert_equal({ "exact" => 1, "misplaced" => 2 }, report.fetch("partial"))
    assert_equal({ "exact" => 1, "misplaced" => 0 }, report.fetch("excessive"))
  end

  test "invalid guesses do not enter history and wrong guesses keep helpful aggregate clues" do
    assert_text "3 positions, 4 symbols, no repeats"
    assert_text "Each symbol can appear only once."
    assert_selector ".detective-slots select", count: 3
    assert_selector ".detective-slots select option", count: 15
    assert_no_selector "#code-answer"
    assert_no_selector ".code-key"
    assert_selector "[data-code-detective-target='secret']", text: "? ? ?"
    click_button "Check my guess"
    assert_text "Choose a symbol for every position"
    assert_no_selector ".detective-history li"
    assert_selector ".detective-slots select[aria-invalid='true']", count: 1
    choose_guess(%w[star star triangle])
    click_button "Check my guess"
    assert_text "Use each symbol only once"
    assert_no_selector ".detective-history li"
    page.execute_script("#{controller_script}.deck[0] = ['star', 'circle', 'triangle']")
    choose_guess(%w[triangle star circle])
    click_button "Check my guess"
    assert_text "3 correct symbols: 0 in the right position, 3 in a different position."
    assert_selector ".detective-history li", count: 1
    assert_selector ".detective-history [role='img'][aria-label='Triangle, Star, Circle']"
    assert_text "0 of 10 codes cracked"
    assert_selector "[data-code-detective-target='secret']", text: "? ? ?"
    assert_no_selector ".detective-slots select[aria-invalid]"
    12.times { click_button "Check my guess" }
    assert_selector ".detective-history li", count: 13
    choose_guess(%w[star circle triangle])
    click_button "Check my guess"
    assert_text "Code cracked! Great detective work!"
    assert_text "1 of 10 codes cracked"
    assert_selector ".detective-history li", count: 14
    assert_selector ".detective-slots select[disabled]", count: 3
    assert_selector "[data-code-detective-target='secret'][aria-label='Secret code: Star, Circle, Triangle']"
    assert_button "A little hint", disabled: true
  end

  test "hard guesses allow repeats and hint is limited and stays visible through retries" do
    find("[data-level='hard']").click
    assert_text "4 positions, 6 symbols, repeats allowed"
    assert_text "Symbols may repeat"
    page.execute_script("#{controller_script}.deck[0] = ['star', 'star', 'circle', 'triangle']")
    click_button "A little hint"
    assert_text "Your hint: Position 1 is Star"
    assert_button "A little hint", disabled: true
    page.execute_script("#{controller_script}.hint()")
    choose_guess(%w[star circle star star])
    click_button "Check my guess"
    assert_text "3 correct symbols: 1 in the right position, 2 in a different position."
    assert_text "Your hint: Position 1 is Star"
    assert_selector ".detective-history li", count: 1
    assert_text "0 of 10 codes cracked"
    choose_guess(%w[star star circle triangle])
    click_button "Check my guess"
    assert_text "1 of 10 codes cracked"
    page.execute_script("#{controller_script}.hint()")
    assert_text "Code cracked!"
    click_button "Next code"
    assert_text "CODE 2 OF 10"
    assert_button "A little hint", disabled: false
    assert_equal "", find("[data-code-detective-target='hint']", visible: :all).text
    assert_no_selector ".detective-history li"
  end

  test "all levels finish ten codes and replay preserves choices and resets history and hints" do
    %w[easy medium hard].each do |level|
      find("[data-level='#{level}']").click
      10.times do |index|
        assert_text "CODE #{index + 1} OF 10"
        assert_no_selector ".detective-history li"
        assert_button "A little hint", disabled: false
        assert_equal [ "" ] * (level == "easy" ? 3 : 4), all(".detective-slots select").map(&:value)
        click_button "A little hint"
        choose_guess(page.evaluate_script("#{controller_script}.secret"))
        click_button "Check my guess"
        assert_text "#{index + 1} of 10 codes cracked"
        assert_selector "[data-code-detective-target='bar'][aria-valuenow='#{index + 1}']"
        assert_selector ".detective-history li", count: 1
        assert_button "A little hint", disabled: true
        if index < 9
          click_button "Next code"
        else
          assert_text "You cracked all ten codes!"
          click_button "Play again"
        end
        assert_equal "position-1", page.evaluate_script("document.activeElement.name")
      end
      assert_selector "#code-type option:checked", text: "Code Detective"
      assert_selector "[data-level='#{level}'][aria-pressed='true']"
      assert_text "0 of 10 codes cracked"
      assert_text "CODE 1 OF 10"
      assert_no_selector ".detective-history li"
      assert_button "A little hint", disabled: false
    end
  end

  test "switching levels types and reloading clears detective state without affecting cipher play" do
    click_button "A little hint"
    choose_guess(page.evaluate_script("#{controller_script}.secret"))
    click_button "Check my guess"
    find("[data-level='medium']").click
    assert_text "0 of 10 codes cracked"
    assert_selector ".detective-slots select", count: 4
    assert_no_selector ".detective-history li"
    assert_button "A little hint", disabled: false
    click_button "A little hint"
    choose_guess(%w[star circle triangle square])
    select "Number codes", from: "Code type"
    assert_text "Longer words and more decoding"
    assert_selector ".code-key li", count: 26
    assert_field "Your decoded message", with: ""
    assert_no_selector ".detective-slots"
    fill_in "Your decoded message", with: "rabbit"
    click_button "Check my answer"
    assert_text "Code cracked!"
    select "Code Detective", from: "Code type"
    assert_text "CODE 1 OF 10"
    assert_text "0 of 10 codes cracked"
    assert_equal [ "" ] * 4, all(".detective-slots select").map(&:value)
    assert_no_selector ".detective-history li"
    assert_button "A little hint", disabled: false
    visit code_breaker_url
    assert_selector "#code-type option:checked", text: "Symbol codes"
    assert_selector "[data-level='easy'][aria-pressed='true']"
    assert_no_selector ".detective-slots"
  end

  test "mobile keyboard play works at every level and does not change saved game progress" do
    storage = page.evaluate_script("JSON.stringify(Object.entries(localStorage).sort())")
    [ 320, 375, 1400 ].each do |width|
      page.current_window.resize_to(width, 1200)
      %w[easy medium hard].each do |level|
        find("[data-level='#{level}']").send_keys(:enter)
        assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth"), "#{level}/#{width}px"
        first = find(".detective-slots select", match: :first)
        first.send_keys(:arrow_down)
        assert_not_equal "", first.value
        choose_guess(page.evaluate_script("#{controller_script}.secret"))
        find("[data-code-detective-target='checkButton']").send_keys(:enter)
        assert_text "Code cracked!"
        find("[data-code-detective-target='checkButton']").send_keys(:enter)
        assert_text "CODE 2 OF 10"
        assert_equal "position-1", page.evaluate_script("document.activeElement.name")
      end
    end
    assert_equal storage, page.evaluate_script("JSON.stringify(Object.entries(localStorage).sort())")
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  private

  def choose_guess(symbols)
    symbols.each_with_index do |symbol, index|
      find_field("Position #{index + 1}").find("option[value='#{symbol}']").select_option
    end
  end

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'code-detective\']"), "code-detective")'
  end
end
